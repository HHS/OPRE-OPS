"""Round-robin reviewer rotation for PRs, driven by .github/workflows/review_rotation.yml.

When the rotation label is added to a PR, the next available pool member is requested as a
reviewer, a bot comment records the pick, and Slack is pinged. The PR author can comment
/reroll to drop the current pick and move to the next available person.

"Available" means: not the PR author, not already picked for this PR, and not off today on the
team calendar. Picks for a PR are stored in a hidden marker inside the bot comment, so the
rotation needs no state outside GitHub.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

MARKER_RE = re.compile(r"<!-- review-rotation: (\{.*?\}) -->")
OFF_WORDS = ("ooo", "pto", "off", "out", "leave", "sick", "holiday", "vacation")
BOT_LOGIN = "github-actions[bot]"
OFF_WORDS_RE = re.compile(r"\b(" + "|".join(OFF_WORDS) + r")\b", re.IGNORECASE)


@dataclass(frozen=True)
class Member:
    github: str
    calendar_names: tuple[str, ...]


def load_pool(config: dict) -> list[Member]:
    return [Member(m["github"].lower(), tuple(m["calendar_names"])) for m in config["pool"]]


def is_off_event(summary: str, calendar_names: tuple[str, ...]) -> bool:
    """An event marks someone off when its title has one of their names and an off word."""
    if not OFF_WORDS_RE.search(summary):
        return False
    return any(re.search(rf"\b{re.escape(name)}\b", summary, re.IGNORECASE) for name in calendar_names)


def off_hours(intervals: list[tuple[datetime, datetime]], day_start: datetime, day_end: datetime) -> float:
    """Hours of `day_start..day_end` covered by `intervals`, counting overlapping events once."""
    clipped = sorted((max(s, day_start), min(e, day_end)) for s, e in intervals if s < day_end and e > day_start)
    total = timedelta()
    cur_start, cur_end = None, None
    for s, e in clipped:
        if cur_end is None or s > cur_end:
            if cur_end is not None:
                total += cur_end - cur_start
            cur_start, cur_end = s, e
        else:
            cur_end = max(cur_end, e)
    if cur_end is not None:
        total += cur_end - cur_start
    return total.total_seconds() / 3600


def people_off(ics_text: str, pool: list[Member], today: date, tz: ZoneInfo, min_off_hours: float) -> set[str]:
    """GitHub logins of pool members who are off on `today` (in `tz`).

    An all-day off event always counts. Timed off events count only once they add up to
    `min_off_hours` that day, so a short appointment doesn't take someone out of the rotation.
    """
    # Imported here so the pure rotation logic stays importable without the calendar deps.
    import icalendar
    import recurring_ical_events

    calendar = icalendar.Calendar.from_ical(ics_text)
    day_start = datetime.combine(today, time.min, tz)
    day_end = day_start + timedelta(days=1)
    events = recurring_ical_events.of(calendar).between(day_start, day_end)

    off = set()
    for member in pool:
        timed = []
        for event in events:
            if not is_off_event(str(event.get("SUMMARY", "")), member.calendar_names):
                continue
            start = event["DTSTART"].dt
            if not isinstance(start, datetime):  # all-day event
                off.add(member.github)
                break
            end = event["DTEND"].dt if "DTEND" in event else start
            # Floating times (no timezone) are read as the team's timezone.
            timed.append((start if start.tzinfo else start.replace(tzinfo=tz), end if end.tzinfo else end.replace(tzinfo=tz)))
        else:
            if off_hours(timed, day_start, day_end) >= min_off_hours:
                off.add(member.github)
    return off


def choose_reviewer(
    pool: list[Member], pr_number: int, author: str, already_picked: list[str], off: set[str]
) -> str | None:
    """Walk the pool from the PR's rotation slot, returning the first available member."""
    excluded = {author.lower(), *already_picked, *off}
    start = pr_number % len(pool)
    for i in range(len(pool)):
        candidate = pool[(start + i) % len(pool)].github
        if candidate not in excluded:
            return candidate
    return None


def parse_history(comment_body: str) -> list[str]:
    """Picks recorded in the marker; a missing or malformed marker counts as no history."""
    match = MARKER_RE.search(comment_body or "")
    if not match:
        return []
    try:
        picked = json.loads(match.group(1))["picked"]
    except (ValueError, KeyError, TypeError):
        return []
    return [p for p in picked if isinstance(p, str)] if isinstance(picked, list) else []


def render_comment(picked: list[str], off: set[str], current: str | None, reroll_found_nobody: bool = False) -> str:
    marker = f"<!-- review-rotation: {json.dumps({'picked': picked})} -->"
    lines = [marker]
    if current:
        lines.append(f"**Reviewer:** @{current} (picked by rotation)")
        if reroll_found_nobody:
            lines.append(f"The last `/reroll` found nobody else available, so @{current} stays the reviewer.")
    else:
        lines.append("**Reviewer:** nobody in the rotation is available right now. Please pick a reviewer manually.")
    # Backticks, not @, so skipped people don't get a GitHub notification.
    previous = [p for p in picked if p != current]
    if previous:
        lines.append(f"Previously picked: {', '.join(f'`{p}`' for p in previous)}")
    if off:
        lines.append(f"Off today per the team calendar: {', '.join(f'`{p}`' for p in sorted(off))}")
    lines.append("")
    lines.append("Not the right person? The PR author can comment `/reroll` to pick the next available reviewer.")
    return "\n".join(lines)


def slack_escape(text: str) -> str:
    # Slack mrkdwn treats &, <, > as syntax, so escape them per Slack's formatting spec.
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def slack_mention(login: str, slack_map: dict) -> str:
    slack_id = slack_map.get(login.lower())
    return f"<@{slack_id}>" if slack_id else f"@{login}"


def build_slack_text(
    mode: str, actor: str, pr: dict, repo: str, new_pick: str | None, old_pick: str | None, slack_map: dict
) -> str:
    link = f"<{pr['html_url']}|{repo}#{pr['number']}: {slack_escape(pr['title'])}>"
    if mode == "reroll":
        action = f"*{actor}* rerolled the reviewer for {link}" + (f" (was {slack_escape(old_pick)})" if old_pick else "")
    else:
        action = f"*{actor}* marked {link} ready for human review"
    if new_pick:
        return f"{action} → {slack_mention(new_pick, slack_map)} is up"
    return f"{action}, but nobody in the rotation is available. Please pick a reviewer manually."


def open_https(req: urllib.request.Request | str, timeout: int):
    """urlopen, but only for https:// URLs, so a misconfigured secret can't read file:// or hit http://.

    Every URL here comes from a constant (the GitHub API) or a repo secret (calendar, Slack), never
    from PR content, so Semgrep's dynamic-urllib alert is a false positive once the scheme is pinned.
    """
    url = req.full_url if isinstance(req, urllib.request.Request) else req
    if urllib.parse.urlsplit(url).scheme != "https":
        raise ValueError("refusing a non-https URL")
    # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
    return urllib.request.urlopen(req, timeout=timeout)


class GitHub:
    def __init__(self, token: str, repo: str):
        self.token = token
        self.base = f"https://api.github.com/repos/{repo}"

    def request(self, method: str, path: str, body: dict | None = None):
        req = urllib.request.Request(
            self.base + path,
            method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        with open_https(req, timeout=15) as resp:
            raw = resp.read()
        return json.loads(raw) if raw else None

    def bot_comment(self, pr_number: int) -> dict | None:
        page = 1
        while True:
            comments = self.request("GET", f"/issues/{pr_number}/comments?per_page=100&page={page}")
            for comment in comments:
                # Only the bot's own comment holds the history; a marker anyone else posts is ignored.
                if comment["user"]["login"] == BOT_LOGIN and MARKER_RE.search(comment["body"] or ""):
                    return comment
            if len(comments) < 100:
                return None
            page += 1


def fetch_calendar_off(pool: list[Member], tz: ZoneInfo, min_off_hours: float) -> set[str]:
    """Fail open: a missing or broken calendar means nobody is treated as off."""
    url = os.environ.get("TEAM_CALENDAR_ICS_URL")
    if not url:
        print("::warning::TEAM_CALENDAR_ICS_URL is not set; picking without checking the team calendar.")
        return set()
    try:
        with open_https(url, timeout=15) as resp:
            ics_text = resp.read().decode()
        return people_off(ics_text, pool, datetime.now(tz).date(), tz, min_off_hours)
    except Exception as exc:  # noqa: BLE001 -- any calendar failure must not block a review pick
        print(f"::warning::Could not read the team calendar ({type(exc).__name__}); picking without it.")
        return set()


def post_slack(text: str) -> None:
    req = urllib.request.Request(
        os.environ["SLACK_WEBHOOK_URL"],
        method="POST",
        data=json.dumps({"text": text}).encode(),
        headers={"Content-Type": "application/json"},
    )
    open_https(req, timeout=10).close()


def main() -> int:
    mode = os.environ["MODE"]  # "label" or "reroll"
    repo = os.environ["REPO"]
    pr_number = int(os.environ["PR_NUMBER"])
    actor = os.environ["ACTOR"]
    with open(os.environ.get("CONFIG_PATH", ".github/review_rotation.json")) as f:
        config = json.load(f)
    with open(os.environ.get("SLACK_MAP_PATH", ".github/slack_user_map.json")) as f:
        slack_map = json.load(f)

    gh = GitHub(os.environ["GITHUB_TOKEN"], repo)
    pr = gh.request("GET", f"/pulls/{pr_number}")
    if config["label"] not in {label["name"] for label in pr["labels"]}:
        print(f"PR is not labeled {config['label']}; nothing to do.")
        return 0

    comment = gh.bot_comment(pr_number)
    picked = parse_history(comment["body"]) if comment else []
    if mode == "label" and picked:
        print(f"A reviewer was already picked ({picked[-1]}); re-adding the label does not reroll.")
        return 0

    pool = load_pool(config)
    tz = ZoneInfo(config["timezone"])
    off = fetch_calendar_off(pool, tz, config.get("min_off_hours", 4))
    old_pick = picked[-1] if picked else None
    new_pick = choose_reviewer(pool, pr_number, pr["user"]["login"], picked, off)

    if new_pick:
        requested = {r["login"].lower() for r in pr["requested_reviewers"]}
        if mode == "reroll" and old_pick in requested:
            gh.request("DELETE", f"/pulls/{pr_number}/requested_reviewers", {"reviewers": [old_pick]})
        gh.request("POST", f"/pulls/{pr_number}/requested_reviewers", {"reviewers": [new_pick]})
        picked = [*picked, new_pick]
    # With no replacement available, a reroll keeps the current pick rather than leaving nobody.
    current = new_pick or old_pick

    body = render_comment(picked, off, current, reroll_found_nobody=mode == "reroll" and not new_pick)
    if comment:
        gh.request("PATCH", f"/issues/comments/{comment['id']}", {"body": body})
    else:
        gh.request("POST", f"/issues/{pr_number}/comments", {"body": body})

    # A reroll that finds nobody changes nothing for the team, so it only updates the PR comment.
    # This also caps Slack posts per PR at the pool size, however many times /reroll is sent.
    if new_pick or mode == "label":
        post_slack(build_slack_text(mode, actor, pr, repo, new_pick, old_pick, slack_map))
    print(f"Picked {new_pick or 'nobody'} (history: {picked}, off today: {sorted(off)})")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except urllib.error.HTTPError as exc:
        print(f"::error::{exc.code} from {exc.url}: {exc.read().decode(errors='replace')[:500]}")
        sys.exit(1)
