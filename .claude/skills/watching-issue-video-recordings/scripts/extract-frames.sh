#!/usr/bin/env bash
# Extract still frames from a video (GitHub issue attachment URL or local file) into a
# temp workspace OUTSIDE the repo, so an agent can Read the frames as images.
#
# Fully autonomous: never writes to the current working directory, never prompts.
# All output goes to a fresh `mktemp -d` directory under the system temp dir.
#
# Usage:
#   extract-frames.sh <url-or-path> [fps] [start] [duration]
#     url-or-path : GitHub user-attachment URL, any http(s) video URL, or a local file
#     fps         : frames per second to sample        (default 2)
#     start       : optional start offset in seconds    (for a zoom pass on a transition)
#     duration    : optional length in seconds from start
#
# Examples:
#   extract-frames.sh https://github.com/user-attachments/assets/<uuid>        # 2 fps over whole clip
#   extract-frames.sh https://github.com/user-attachments/assets/<uuid> 10 2 3 # 10 fps, 2s..5s zoom
#
# On success prints, on stdout:
#   WORKSPACE=<dir>            the temp dir holding video + frames (rm -rf when done)
#   VIDEO=<path>              the downloaded/copied source
#   META: <ffprobe summary>
#   then one absolute frame path per line (sorted) for the agent to Read.

set -euo pipefail

SRC="${1:-}"
FPS="${2:-2}"          # 2 fps default: dense enough to separate a click from the UI it triggers,
                       # without flooding context. Bump to 10+ for a short zoom pass on a transition.
START="${3:-}"
DURATION="${4:-}"

if [[ -z "$SRC" ]]; then
    echo "ERROR: no video url-or-path given" >&2
    echo "usage: extract-frames.sh <url-or-path> [fps] [start] [duration]" >&2
    exit 2
fi

# --- ensure ffmpeg/ffprobe exist (install once on macOS; guide otherwise) -------------
ensure_ffmpeg() {
    if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
        return 0
    fi
    if [[ "$(uname)" == "Darwin" ]] && command -v brew >/dev/null 2>&1; then
        echo "ffmpeg not found; installing via Homebrew (non-interactive)..." >&2
        HOMEBREW_NO_INSTALL_CLEANUP=1 HOMEBREW_NO_ENV_HINTS=1 brew install ffmpeg >&2
        return 0
    fi
    echo "ERROR: ffmpeg/ffprobe required but not installed, and no supported installer found." >&2
    echo "Install ffmpeg (e.g. 'brew install ffmpeg' on macOS, 'apt-get install ffmpeg' on Debian) and retry." >&2
    exit 3
}
ensure_ffmpeg

# --- workspace OUTSIDE the repo (system temp dir) -------------------------------------
WORKSPACE="$(mktemp -d "${TMPDIR:-/tmp}/issue-video.XXXXXX")"
FRAMES_DIR="$WORKSPACE/frames"
mkdir -p "$FRAMES_DIR"

# --- obtain the video into the workspace ----------------------------------------------
VIDEO="$WORKSPACE/source"
if [[ "$SRC" == http://* || "$SRC" == https://* ]]; then
    # -L follows GitHub's redirect to blob storage; attachments need no auth.
    curl -fsSL "$SRC" -o "$VIDEO"
elif [[ -f "$SRC" ]]; then
    cp "$SRC" "$VIDEO"
else
    echo "ERROR: '$SRC' is neither an http(s) URL nor an existing file" >&2
    exit 4
fi

# --- metadata -------------------------------------------------------------------------
META="$(ffprobe -v error -select_streams v:0 \
    -show_entries format=duration:stream=width,height,r_frame_rate \
    -of default=noprint_wrappers=1 "$VIDEO" 2>/dev/null || true)"

# --- build ffmpeg args: optional zoom window, then fps sampling -----------------------
# -ss before -i seeks fast; scale caps very large frames (even dims via -2) to keep the
# image readable without upscaling small clips.
declare -a WINDOW=()
[[ -n "$START" ]] && WINDOW+=(-ss "$START")
[[ -n "$DURATION" ]] && WINDOW+=(-t "$DURATION")

ffmpeg -hide_banner -loglevel error "${WINDOW[@]+"${WINDOW[@]}"}" -i "$VIDEO" \
    -vf "fps=${FPS},scale='min(1600,iw)':-2" -q:v 2 \
    "$FRAMES_DIR/frame_%03d.png"

# --- report ---------------------------------------------------------------------------
echo "WORKSPACE=$WORKSPACE"
echo "VIDEO=$VIDEO"
echo "META: $(echo "$META" | tr '\n' ' ')"
echo "FPS=$FPS${START:+ START=$START}${DURATION:+ DURATION=$DURATION}"
count=$(find "$FRAMES_DIR" -name 'frame_*.png' | wc -l | tr -d ' ')
echo "FRAMES=$count"
find "$FRAMES_DIR" -name 'frame_*.png' | sort
