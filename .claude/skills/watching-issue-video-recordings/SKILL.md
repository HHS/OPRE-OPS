---
name: watching-issue-video-recordings
description: Use when a GitHub issue, PR, or bug report links a screen-recording video (github.com/user-attachments/assets/... .mov/.mp4/.webm) and you need to know what it shows. You cannot view video in context — this extracts still frames to a temp dir so you can Read them as images. Trigger whenever a task references a video/screen recording/attachment demonstrating a bug, or when text says "see the recording"/"linked video".
---

# Watching Issue Video Recordings

## Overview

Issues often attach a screen recording as the clearest record of a bug. You cannot watch video in context, but you can Read image frames. This skill extracts frames from a video (a GitHub attachment URL or local file) into a temp workspace, then reads them.

**Core principle:** Do it autonomously and without polluting the repo, then interpret the frames *against the issue's written words* — never from the frames alone. Sparse frames drop the causal step (a click and the UI it triggers land between samples), so a frames-only reading is a guess. The written repro steps are ground truth for what action was taken; the frames show the result.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Read the issue text FIRST (title, body, repro steps, expected vs actual)
- [ ] 2. Extract frames with the script (2 fps whole-clip pass)
- [ ] 3. Read the frames; map each to a repro step
- [ ] 4. If a transition is ambiguous, zoom-extract that window (10 fps)
- [ ] 5. Reconcile: does my reading match the written repro? If not, resolve before concluding
- [ ] 6. Report frame-by-frame; clean up the temp workspace
```

**Step 1 — Read the issue text first.** Get the title, body, numbered repro steps, and expected-vs-actual. This tells you what page and what action to expect. Do NOT skip this — it is what keeps step 5 honest.

**Step 2 — Extract frames.** Run the bundled script (it installs ffmpeg if missing on macOS, downloads to a `mktemp -d` dir OUTSIDE the repo, prompts for nothing):

```bash
.claude/skills/watching-issue-video-recordings/scripts/extract-frames.sh <url-or-path> [fps] [start] [duration]
```

For a GitHub attachment, pass the `github.com/user-attachments/assets/<uuid>` URL verbatim. Default 2 fps is right for a first pass. The script prints `WORKSPACE=`, `META:`, `FRAMES=`, then one absolute frame path per line.

**Step 3 — Read the frames.** Read the printed frame paths as images (batch several Read calls). Note the URL bar, visible controls, form field contents, cursor position, and any modal.

**Step 4 — Zoom on ambiguity.** If you can't tell *which control was clicked* or *what triggered a modal*, re-run over just that window at high fps — e.g. `... 10 1.5 1.5` samples 10 fps from 1.5s for 1.5s. The click and its effect are usually 1–2 frames apart; 2 fps can merge them.

**Step 5 — Reconcile with the text (the load-bearing step).** State what you think happened, then check it against the repro steps from step 1. If the recording seems to show something the text doesn't describe (e.g. "the button does nothing" when the issue says "clicking X shows the wrong modal"), you are probably misreading a merged transition — zoom in (step 4) before concluding. A confident frames-only narrative that contradicts the written steps is the most common failure of this task.

**Step 6 — Report and clean up.** Give a concise frame-by-frame account tied to timestamps/steps. Then remove the workspace by its literal path: `rm -rf <the WORKSPACE path the script printed>`. Do not glob-delete other temp dirs — unrelated `issue-video.*` dirs from other sessions may exist; leave any you did not create.

## Hard constraints

- **Never write into the repo working directory.** The script uses `mktemp -d` under the system temp dir. If you extract manually, do the same — a downloaded `.mov` or a `frames/` dir committed to the repo is a defect.
- **Fully autonomous.** No prompts, no "where should I save this?", no auth. GitHub user-attachment URLs are public and need no token; `curl -L` follows the redirect to blob storage.
- **Verify the repo stayed clean** with `git status --porcelain` before reporting done.

## Quick Reference

| Need | Command |
|---|---|
| First pass, whole clip | `extract-frames.sh <url>` (2 fps default) |
| Zoom a transition (2s–3.5s) | `extract-frames.sh <url> 10 2 1.5` |
| Local file instead of URL | `extract-frames.sh /path/to/clip.mov` |
| Clean up | `rm -rf <WORKSPACE printed by the script>` |

## Common Mistakes

- **Concluding from frames alone.** The frames show state; the issue text says what action produced it. Read the text first (step 1) and reconcile (step 5). This is the failure that produced a confidently-wrong bug interpretation in baseline testing.
- **Sampling too sparsely and merging a click with its result.** At 2 fps a click and the modal it opens can be adjacent frames or the click frame is skipped entirely — so it looks like the modal "just appeared" or the click "did nothing." Zoom to 10 fps on the transition.
- **Downloading into the repo.** Polluting the working tree. Always use the temp workspace; the script enforces it.
- **Stopping to ask where to save / for credentials.** Not needed — public attachment, temp dir. Run to completion.
- **Trusting the modal's copy over the trigger.** A dialog reading "Are you sure you want to cancel?" does not prove the user clicked *Cancel* — a nav guard can raise the same modal on *any* blocked navigation (e.g. an Edit button). Identify the clicked control from the cursor + zoom, then cross-check the repro steps.

## Real-World Impact

On issue 6061, the attached recording was the key to the diagnosis: a frame showed the Notes field already contained text (`asdfasdfasdfasdf`) before "Edit" was clicked — the precondition (`hasChanged`) that made the navigation guard fire. A baseline agent working from a sparse 1 fps pass, without reading the issue text, concluded the bug was "'Yes, Cancel' does nothing" — the opposite of the real Edit→wrong-modal bug — because the click→modal transition fell between samples. Reading the text first and zooming on the transition (steps 1, 4, 5) prevents that.
