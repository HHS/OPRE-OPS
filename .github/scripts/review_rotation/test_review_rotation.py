from datetime import date
from typing import ClassVar
from zoneinfo import ZoneInfo

import pytest
import review_rotation as rr

TZ = ZoneInfo("America/New_York")
POOL = [
    rr.Member("alice", ("Alice",)),
    rr.Member("bob", ("Bob", "Robert")),
    rr.Member("carol", ("Carol",)),
]


def ics(*events: str) -> str:
    body = "".join(f"BEGIN:VEVENT\r\nUID:{i}@test\r\n{e}\r\nEND:VEVENT\r\n" for i, e in enumerate(events))
    return f"BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:test\r\n{body}END:VCALENDAR\r\n"


class TestIsOffEvent:
    @pytest.mark.parametrize("summary", ["Alice OOO", "alice - PTO", "Alice out sick", "Holiday: Alice"])
    def test_name_and_off_word(self, summary):
        assert rr.is_off_event(summary, ("Alice",))

    @pytest.mark.parametrize(
        "summary",
        [
            "Alice / Bob 1:1",  # name but no off word
            "Team offsite planning",  # off word only inside a longer word
            "Bob OOO",  # someone else
            "Malice OOO",  # name only inside a longer word
        ],
    )
    def test_not_off(self, summary):
        assert not rr.is_off_event(summary, ("Alice",))

    def test_any_calendar_name_matches(self):
        assert rr.is_off_event("Robert PTO", ("Bob", "Robert"))


class TestPeopleOff:
    def test_all_day_event_today(self):
        cal = ics("DTSTART;VALUE=DATE:20261029\r\nDTEND;VALUE=DATE:20261030\r\nSUMMARY:Alice OOO")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == {"alice"}

    def test_all_day_event_other_day_ignored(self):
        cal = ics("DTSTART;VALUE=DATE:20261030\r\nDTEND;VALUE=DATE:20261031\r\nSUMMARY:Alice OOO")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == set()

    def test_multi_day_event_covering_today(self):
        cal = ics("DTSTART;VALUE=DATE:20261026\r\nDTEND;VALUE=DATE:20261031\r\nSUMMARY:Bob vacation")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == {"bob"}

    def test_short_appointment_does_not_count(self):
        # 3 hours, under the 4-hour minimum.
        cal = ics("DTSTART:20261029T180000Z\r\nDTEND:20261029T210000Z\r\nSUMMARY:Carol out - appointment")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == set()

    def test_long_timed_absence_counts(self):
        cal = ics("DTSTART:20261029T130000Z\r\nDTEND:20261029T180000Z\r\nSUMMARY:Carol out - morning")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == {"carol"}

    def test_overlapping_events_count_once(self):
        # 9-12 and 11-14 Eastern: 5 hours combined, not 6.
        cal = ics(
            "DTSTART;TZID=America/New_York:20261029T090000\r\nDTEND;TZID=America/New_York:20261029T120000\r\n"
            "SUMMARY:Reed OOO",
            "DTSTART;TZID=America/New_York:20261029T110000\r\nDTEND;TZID=America/New_York:20261029T140000\r\n"
            "SUMMARY:Reed out",
        )
        pool = [rr.Member("reed", ("Reed",))]
        assert rr.people_off(cal, pool, date(2026, 10, 29), TZ, 5) == {"reed"}
        assert rr.people_off(cal, pool, date(2026, 10, 29), TZ, 5.5) == set()

    def test_short_events_add_up(self):
        cal = ics(
            "DTSTART:20261029T130000Z\r\nDTEND:20261029T150000Z\r\nSUMMARY:Alice out",
            "DTSTART:20261029T180000Z\r\nDTEND:20261029T200000Z\r\nSUMMARY:Alice out again",
        )
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == {"alice"}

    def test_only_hours_inside_today_count(self):
        # 10pm-4am Eastern: only 2 of the 6 hours fall on Oct 29.
        cal = ics(
            "DTSTART;TZID=America/New_York:20261029T220000\r\nDTEND;TZID=America/New_York:20261030T040000\r\n"
            "SUMMARY:Bob out - travel"
        )
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == set()

    def test_recurring_event(self):
        # Weekly Thursday off, starting weeks before today.
        cal = ics("DTSTART;VALUE=DATE:20261001\r\nDTEND;VALUE=DATE:20261002\r\nRRULE:FREQ=WEEKLY\r\nSUMMARY:Bob off")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == {"bob"}

    def test_non_off_event_ignored(self):
        cal = ics("DTSTART:20261029T150000Z\r\nDTEND:20261029T160000Z\r\nSUMMARY:Alice / Carol sync")
        assert rr.people_off(cal, POOL, date(2026, 10, 29), TZ, 4) == set()


class TestChooseReviewer:
    def test_starts_at_pr_rotation_slot(self):
        assert rr.choose_reviewer(POOL, 4, "zed", [], set()) == "bob"  # 4 % 3 == 1

    def test_skips_author_case_insensitively(self):
        assert rr.choose_reviewer(POOL, 4, "Bob", [], set()) == "carol"

    def test_skips_already_picked_and_off(self):
        assert rr.choose_reviewer(POOL, 4, "zed", ["bob"], {"carol"}) == "alice"

    def test_wraps_around_pool(self):
        assert rr.choose_reviewer(POOL, 5, "carol", [], set()) == "alice"

    def test_nobody_available(self):
        assert rr.choose_reviewer(POOL, 4, "alice", ["bob"], {"carol"}) is None


class TestComment:
    def test_history_round_trips(self):
        body = rr.render_comment(["bob", "carol"], {"alice"}, "carol", "o/r")
        assert rr.parse_history(body) == ["bob", "carol"]

    def test_only_current_pick_is_mentioned(self):
        body = rr.render_comment(["bob", "carol"], {"alice"}, "carol", "o/r")
        assert "@carol" in body
        assert "@bob" not in body and "@alice" not in body

    def test_includes_intent_and_risk_reminder_with_review_md_link(self):
        body = rr.render_comment(["bob"], set(), "bob", "HHS/OPRE-OPS")
        assert "intent" in body and "risk" in body
        assert "https://github.com/HHS/OPRE-OPS/blob/main/docs/REVIEW.md#the-human-reviewers-role" in body

    def test_no_marker_means_no_history(self):
        assert rr.parse_history("just a normal comment") == []

    @pytest.mark.parametrize(
        "marker",
        ["{not json}", '{"other": 1}', '{"picked": "bob"}'],
    )
    def test_malformed_marker_means_no_history(self, marker):
        assert rr.parse_history(f"<!-- review-rotation: {marker} -->") == []

    def test_non_string_picks_are_dropped(self):
        assert rr.parse_history('<!-- review-rotation: {"picked": ["bob", {"x": 1}, 3]} -->') == ["bob"]


class TestSlackText:
    PR: ClassVar[dict] = {"html_url": "https://github.com/o/r/pull/7", "number": 7, "title": "Fix <script> & stuff"}

    def test_escapes_title_and_maps_slack_id(self):
        text = rr.build_slack_text("label", "dana", self.PR, "o/r", "bob", None, {"bob": "U123"})
        assert "Fix &lt;script&gt; &amp; stuff" in text
        assert "<@U123> is up" in text

    def test_escapes_previous_pick(self):
        text = rr.build_slack_text("reroll", "dana", self.PR, "o/r", "carol", "<!channel>", {})
        assert "<!channel>" not in text and "&lt;!channel&gt;" in text

    def test_unmapped_user_falls_back_to_login(self):
        text = rr.build_slack_text("reroll", "dana", self.PR, "o/r", "carol", "bob", {})
        assert "@carol is up" in text and "(was bob)" in text

    def test_nobody_available(self):
        text = rr.build_slack_text("label", "dana", self.PR, "o/r", None, None, {})
        assert "nobody in the rotation is available" in text


class TestOpenHttps:
    @pytest.mark.parametrize("url", ["file:///etc/passwd", "http://example.com/cal.ics", "ftp://example.com/x"])
    def test_rejects_non_https(self, url):
        with pytest.raises(ValueError):
            rr.open_https(url, timeout=1)

    def test_rejects_non_https_request(self):
        with pytest.raises(ValueError):
            rr.open_https(rr.urllib.request.Request("file:///etc/passwd"), timeout=1)


class FakeGitHub(rr.GitHub):
    """Replaces only the HTTP call: records writes, serves the PR and its comments."""

    def __init__(self, pr, comments):
        self.pr = pr
        self.comments = comments
        self.calls = []

    def request(self, method, path, body=None):
        self.calls.append((method, path, body))
        if method == "GET" and path.startswith("/pulls/"):
            return self.pr
        if method == "GET" and "/comments" in path:
            return self.comments
        return {}


@pytest.fixture
def run(tmp_path, monkeypatch):
    config = tmp_path / "rotation.json"
    config.write_text(
        '{"label": "ready-for-human-review", "timezone": "America/New_York", "pool": ['
        '{"github": "alice", "calendar_names": ["Alice"]},'
        '{"github": "bob", "calendar_names": ["Bob"]},'
        '{"github": "carol", "calendar_names": ["Carol"]}]}'
    )
    slack_map = tmp_path / "slack.json"
    slack_map.write_text("{}")
    slack_posts = []
    monkeypatch.setattr(rr, "post_slack", slack_posts.append)

    def _run(mode, pr, comments=(), off=frozenset()):
        fake = FakeGitHub(pr, list(comments))
        monkeypatch.setattr(rr, "GitHub", lambda token, repo: fake)
        monkeypatch.setattr(rr, "fetch_calendar_off", lambda pool, tz, min_off_hours: set(off))
        for key, value in {
            "MODE": mode,
            "REPO": "o/r",
            "PR_NUMBER": str(pr["number"]),
            "ACTOR": "dana",
            "GITHUB_TOKEN": "t",
            "CONFIG_PATH": str(config),
            "SLACK_MAP_PATH": str(slack_map),
        }.items():
            monkeypatch.setenv(key, value)
        assert rr.main() == 0
        writes = [c for c in fake.calls if c[0] != "GET"]
        return writes, slack_posts

    return _run


def bot_comment(picked, current, comment_id=9):
    return {"id": comment_id, "user": {"login": rr.BOT_LOGIN}, "body": rr.render_comment(picked, set(), current, "o/r")}


def make_pr(number=4, author="dana", labels=("ready-for-human-review",), requested=()):
    return {
        "number": number,
        "title": "A PR",
        "html_url": f"https://github.com/o/r/pull/{number}",
        "user": {"login": author},
        "labels": [{"name": n} for n in labels],
        "requested_reviewers": [{"login": r} for r in requested],
    }


class TestMain:
    def test_label_requests_review_comments_and_pings(self, run):
        writes, slack = run("label", make_pr())
        assert ("POST", "/pulls/4/requested_reviewers", {"reviewers": ["bob"]}) in writes
        comment = next(body for method, path, body in writes if path == "/issues/4/comments")
        assert rr.parse_history(comment["body"]) == ["bob"]
        assert len(slack) == 1 and "@bob is up" in slack[0]

    def test_relabel_does_not_reroll(self, run):
        existing = bot_comment(["bob"], "bob")
        writes, slack = run("label", make_pr(requested=["bob"]), comments=[existing])
        assert writes == [] and slack == []

    def test_unlabeled_pr_is_ignored(self, run):
        writes, slack = run("reroll", make_pr(labels=()))
        assert writes == [] and slack == []

    def test_reroll_swaps_reviewer_and_updates_comment(self, run):
        existing = bot_comment(["bob"], "bob")
        writes, slack = run("reroll", make_pr(requested=["bob"]), comments=[existing], off={"carol"})
        assert writes[0] == ("DELETE", "/pulls/4/requested_reviewers", {"reviewers": ["bob"]})
        assert writes[1] == ("POST", "/pulls/4/requested_reviewers", {"reviewers": ["alice"]})
        assert writes[2][0:2] == ("PATCH", "/issues/comments/9")
        assert rr.parse_history(writes[2][2]["body"]) == ["bob", "alice"]
        assert "@alice is up" in slack[0] and "(was bob)" in slack[0]

    def test_reroll_with_nobody_left_keeps_current_pick(self, run):
        existing = bot_comment(["bob"], "bob")
        writes, slack = run("reroll", make_pr(requested=["bob"]), comments=[existing], off={"alice", "carol"})
        assert [w[0] for w in writes] == ["PATCH"]
        assert "@bob stays the reviewer" in writes[0][2]["body"]
        assert slack == []

    def test_marker_from_a_human_is_ignored(self, run):
        forged = {"id": 5, "user": {"login": "mallory"}, "body": '<!-- review-rotation: {"picked": ["x"]} -->'}
        writes, slack = run("label", make_pr(), comments=[forged])
        assert ("POST", "/pulls/4/requested_reviewers", {"reviewers": ["bob"]}) in writes
        assert ("POST", "/issues/4/comments") in [w[0:2] for w in writes]
        assert not any(path == "/issues/comments/5" for _, path, _ in writes)
        assert len(slack) == 1
