"""Unit tests for the awarded-agreement "will require a contract modification" notice (#6476).

Per the updated Figma design (node 38045:148705):
- Agreement-level fields in scope: project specialist and COR. Title, NOFO number, grant
  funding period, nickname, description and team member changes dropped the notice.
- Grant numbers and ALN numbers dropped the notice entirely (out of scope now).
- Services Components (added, Period of Performance dates, deleted) gained the notice.
- Budget line fields (CAN, Amount, Obligate By, status, new/deleted line) only get the
  notice once the line is past Draft status -- a Draft line's edit never needs a paper mod,
  even on an awarded agreement.

Pure unit tests — no DB or Docker required.
"""

from unittest.mock import MagicMock, patch

from models import AgreementType
from models.agreement_history import (
    _awarded_mod_notice,
    agreement_history_trigger_func,
    create_agreement_update_history_event,
    create_bli_update_history_events,
    create_grant_number_history_event,
    create_services_component_history_event,
)

AWARDED_NOTICE = (
    " This agreement is awarded and will require a contract modification in order to make changes to the contract."
)


def _make_user(full_name, user_id=503):
    u = MagicMock()
    u.id = user_id
    u.full_name = full_name
    return u


def _make_agreement(is_awarded, agreement_id=1, agreement_type=AgreementType.CONTRACT):
    """Defaults to Contract, since contract modifications don't exist for other agreement
    types (OPS-3072/3153) -- see TestAwardedModNoticeAgreementTypeGating below."""
    agreement = MagicMock()
    agreement.is_awarded = is_awarded
    agreement.id = agreement_id
    agreement.agreement_type = agreement_type
    return agreement


def _make_bli(status, bli_id=99):
    bli = MagicMock()
    bli.id = bli_id
    bli.status = status
    return bli


def _make_session(agreement):
    session = MagicMock()
    session.get.side_effect = lambda cls, pk: agreement if pk == agreement.id else None
    return session


def _make_lookup_session(*objects):
    """A session.get() stand-in that resolves by id across several mocked objects."""
    by_id = {obj.id: obj for obj in objects}
    session = MagicMock()
    session.get.side_effect = lambda cls, pk: by_id.get(pk)
    return session


class TestAwardedModNotice:
    def test_appends_notice_when_awarded(self):
        assert _awarded_mod_notice(_make_agreement(True)) == AWARDED_NOTICE

    def test_empty_when_not_awarded(self):
        assert _awarded_mod_notice(_make_agreement(False)) == ""

    def test_empty_when_agreement_is_none(self):
        assert _awarded_mod_notice(None) == ""


class TestAwardedModNoticeAgreementTypeGating:
    """Contract modifications (OPS-3072/3153) only exist for Contract and AA agreements --
    a Grant, Direct Obligation, or IAA agreement has no such process, awarded or not. An
    awarded Grant's COR change applies directly with no pending modification created (see
    test_cor_change_awarded.py::test_awarded_grant_project_officer_change_applies_directly),
    so the notice must never claim one is needed for these types."""

    def test_awarded_contract_gets_notice(self):
        assert _awarded_mod_notice(_make_agreement(True, agreement_type=AgreementType.CONTRACT)) == AWARDED_NOTICE

    def test_awarded_aa_gets_notice(self):
        assert _awarded_mod_notice(_make_agreement(True, agreement_type=AgreementType.AA)) == AWARDED_NOTICE

    def test_awarded_grant_has_no_notice(self):
        assert _awarded_mod_notice(_make_agreement(True, agreement_type=AgreementType.GRANT)) == ""

    def test_awarded_direct_obligation_has_no_notice(self):
        assert _awarded_mod_notice(_make_agreement(True, agreement_type=AgreementType.DIRECT_OBLIGATION)) == ""

    def test_awarded_iaa_has_no_notice(self):
        assert _awarded_mod_notice(_make_agreement(True, agreement_type=AgreementType.IAA)) == ""


class TestCreateAgreementUpdateHistoryEventAwardedNotice:
    """Fields the story puts in scope: project_officer_id (COR), alternate_project_officer_id
    (project specialist). name, nofo_number, funding_period_months, nick_name and description
    dropped the notice in the updated Figma design (see tests below confirming they're
    untouched)."""

    def _call(self, property_name, old_value, new_value, agreement):
        session = _make_session(agreement)
        return create_agreement_update_history_event(
            property_name,
            old_value,
            new_value,
            _make_user("Steve Tekell"),
            "2024-06-01T00:00:00.000000Z",
            agreement.id,
            1,
            session,
            _make_user("System User", user_id=1),
        )

    def test_name_change_on_awarded_agreement_has_no_notice(self):
        """name (title) dropped the notice in the updated Figma design."""
        result = self._call("name", "Old Title", "New Title", _make_agreement(True))
        assert AWARDED_NOTICE not in result.history_message

    def test_nofo_number_change_on_awarded_agreement_has_no_notice(self):
        """nofo_number dropped the notice in the updated Figma design."""
        result = self._call("nofo_number", "NOFO-1", "NOFO-2", _make_agreement(True))
        assert AWARDED_NOTICE not in result.history_message

    def test_contract_number_change_on_awarded_agreement_has_no_notice(self):
        """contract_number is a simple_property_names field but not one of the two in scope."""
        result = self._call("contract_number", "A1", "A2", _make_agreement(True))
        assert AWARDED_NOTICE not in result.history_message

    def test_description_change_on_awarded_agreement_has_no_notice(self):
        """description dropped the notice in the updated Figma design."""
        result = self._call("description", "Old", "New", _make_agreement(True))
        assert AWARDED_NOTICE not in result.history_message

    def test_nick_name_change_on_awarded_agreement_has_no_notice(self):
        """nick_name dropped the notice in the updated Figma design."""
        result = self._call("nick_name", "Old", "New", _make_agreement(True))
        assert AWARDED_NOTICE not in result.history_message

    def test_funding_period_months_change_on_awarded_agreement_has_no_notice(self):
        """funding_period_months dropped the notice in the updated Figma design."""
        result = self._call("funding_period_months", 12, 18, _make_agreement(True))
        assert AWARDED_NOTICE not in result.history_message

    def test_project_officer_id_change_on_awarded_agreement_gets_notice(self):
        """COR change -- added per the updated Figma design (OPS-3153's admin-change flow
        updates this same field, so this notice applies there too)."""
        agreement = _make_agreement(True)
        session = _make_session(agreement)
        session.get.side_effect = lambda cls, pk: (
            agreement if pk == agreement.id else _make_user("Some COR", user_id=pk) if pk else None
        )
        result = create_agreement_update_history_event(
            "project_officer_id",
            None,
            999,
            _make_user("Steve Tekell"),
            "2024-06-01T00:00:00.000000Z",
            agreement.id,
            1,
            session,
            _make_user("System User", user_id=1),
        )
        assert result.history_message.endswith(AWARDED_NOTICE)

    def test_alternate_project_officer_id_change_on_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        session = _make_session(agreement)
        session.get.side_effect = lambda cls, pk: (
            agreement if pk == agreement.id else _make_user("Some PO", user_id=pk) if pk else None
        )
        result = create_agreement_update_history_event(
            "alternate_project_officer_id",
            None,
            999,
            _make_user("Steve Tekell"),
            "2024-06-01T00:00:00.000000Z",
            agreement.id,
            1,
            session,
            _make_user("System User", user_id=1),
        )
        assert result.history_message.endswith(AWARDED_NOTICE)

    def test_vendor_id_change_on_awarded_agreement_has_no_notice(self):
        """vendor_id is out of scope for this story; confirm it's untouched."""
        agreement = _make_agreement(True)
        session = _make_session(agreement)
        result = create_agreement_update_history_event(
            "vendor_id",
            None,
            None,
            _make_user("Steve Tekell"),
            "2024-06-01T00:00:00.000000Z",
            agreement.id,
            1,
            session,
            _make_user("System User", user_id=1),
        )
        assert AWARDED_NOTICE not in result.history_message


class TestCreateGrantNumberHistoryEventAwardedNotice:
    """Grant numbers dropped the notice entirely in the updated Figma design -- confirms
    every branch (including PoP dates, which used to get it) is untouched regardless of
    award status."""

    def _make_event(self, changes):
        event = MagicMock()
        event.event_details = {
            "grant_number_updates": {
                "changes": changes,
                "gn_display_name": "Grant 2",
                "owner_id": 1,
            }
        }
        return event

    def test_period_start_change_on_awarded_agreement_has_no_notice(self):
        event = self._make_event({"period_start": {"old_value": "2025-01-15", "new_value": "2026-01-15"}})
        result = create_grant_number_history_event(event, _make_user("Steve Tekell"), False)
        assert AWARDED_NOTICE not in result[0].history_message

    def test_period_end_change_on_awarded_agreement_has_no_notice(self):
        event = self._make_event({"period_end": {"old_value": "2025-01-15", "new_value": "2026-01-15"}})
        result = create_grant_number_history_event(event, _make_user("Steve Tekell"), False)
        assert AWARDED_NOTICE not in result[0].history_message

    def test_number_change_on_awarded_agreement_has_no_notice(self):
        event = self._make_event({"number": {"old_value": "G1", "new_value": "G2"}})
        result = create_grant_number_history_event(event, _make_user("Steve Tekell"), False)
        assert AWARDED_NOTICE not in result[0].history_message


class TestCreateServicesComponentHistoryEventAwardedNotice:
    """Services Components gained the notice in the updated Figma design -- for Period of
    Performance date changes only, not description/number/sub_component/optional."""

    def _make_event(self, changes, owner_id=1):
        event = MagicMock()
        event.event_details = {
            "services_component_updates": {
                "changes": changes,
                "sc_display_name": "SC2",
                "sc_display_number": 2,
                "owner_id": owner_id,
            }
        }
        return event

    def test_period_start_change_on_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        event = self._make_event({"period_start": {"old_value": "2025-01-15", "new_value": "2026-01-15"}})
        result = create_services_component_history_event(
            event, _make_user("Steve Tekell"), False, _make_session(agreement)
        )
        assert result[0].history_message.endswith(AWARDED_NOTICE)

    def test_period_end_change_on_non_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(False)
        event = self._make_event({"period_end": {"old_value": "2025-01-15", "new_value": "2026-01-15"}})
        result = create_services_component_history_event(
            event, _make_user("Steve Tekell"), False, _make_session(agreement)
        )
        assert AWARDED_NOTICE not in result[0].history_message

    def test_description_change_on_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        event = self._make_event({"description": {"old_value": "Old", "new_value": "New"}})
        result = create_services_component_history_event(
            event, _make_user("Steve Tekell"), False, _make_session(agreement)
        )
        assert AWARDED_NOTICE not in result[0].history_message

    def test_number_change_on_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        event = self._make_event({"number": {"old_value": 1, "new_value": 2}})
        result = create_services_component_history_event(
            event, _make_user("Steve Tekell"), False, _make_session(agreement)
        )
        assert AWARDED_NOTICE not in result[0].history_message


class TestCreateBliUpdateHistoryEventsDraftVsPlannedNotice:
    """CAN/Amount/Obligate By/status changes only reach this function via a direct (non-CR)
    edit -- either a Draft line (never needs a mod) or a super-user bypass on a Planned/
    Executing line (which does, on an awarded agreement). The notice must track the line's
    own status, not just the agreement's awarded flag."""

    def _call(self, changes, agreement, bli):
        event = MagicMock()
        event.event_details = {
            "bli_updates": {"changes": changes},
            "bli": {"id": bli.id, "agreement_id": agreement.id},
        }
        event.created_on = MagicMock()
        event.created_on.strftime.return_value = "2024-06-01T00:00:00.000000Z"
        event.id = 1
        session = _make_lookup_session(agreement, bli)
        return create_bli_update_history_events(
            event, _make_user("Steve Tekell"), False, session, _make_user("System User", user_id=1)
        )

    def test_amount_change_on_draft_line_of_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        bli = _make_bli("DRAFT")
        result = self._call({"amount": {"old_value": "100", "new_value": "200"}}, agreement, bli)
        assert AWARDED_NOTICE not in result[0].history_message

    def test_amount_change_on_planned_line_of_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        bli = _make_bli("PLANNED")
        result = self._call({"amount": {"old_value": "100", "new_value": "200"}}, agreement, bli)
        assert result[0].history_message.endswith(AWARDED_NOTICE)

    def test_amount_change_on_planned_line_of_non_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(False)
        bli = _make_bli("PLANNED")
        result = self._call({"amount": {"old_value": "100", "new_value": "200"}}, agreement, bli)
        assert AWARDED_NOTICE not in result[0].history_message

    def test_can_id_change_on_planned_line_of_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        bli = _make_bli("PLANNED")
        result = self._call({"can_id": {"old_value": None, "new_value": None}}, agreement, bli)
        assert result[0].history_message.endswith(AWARDED_NOTICE)

    def test_date_needed_change_on_planned_line_of_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        bli = _make_bli("PLANNED")
        result = self._call({"date_needed": {"old_value": "2025-01-15", "new_value": "2026-01-15"}}, agreement, bli)
        assert result[0].history_message.endswith(AWARDED_NOTICE)

    def test_draft_to_planned_status_change_on_awarded_agreement_gets_notice(self):
        """bli.status reflects the post-update state (PLANNED), so the transition itself
        counts as "past Draft" even though old_value is DRAFT."""
        agreement = _make_agreement(True)
        bli = _make_bli("PLANNED")
        result = self._call({"status": {"old_value": "DRAFT", "new_value": "PLANNED"}}, agreement, bli)
        assert result[0].history_message.endswith(AWARDED_NOTICE)

    def test_line_description_change_on_planned_line_of_awarded_agreement_has_no_notice(self):
        """line_description isn't in the Figma/AC scope -- only CAN/Amount/Obligate By/status."""
        agreement = _make_agreement(True)
        bli = _make_bli("PLANNED")
        result = self._call({"line_description": {"old_value": "Old", "new_value": "New"}}, agreement, bli)
        assert AWARDED_NOTICE not in result[0].history_message


class TestDispatcherLevelAwardedNotice:
    """Confirms the dispatcher's inline cases correctly fetch the agreement (and, for budget
    lines, the line's own status) and append the notice only where the updated Figma design
    now shows it -- not just the extracted helper functions."""

    def _run(self, event_type, event_details, agreement):
        from models import OpsEventType

        event = MagicMock()
        event.event_type = getattr(OpsEventType, event_type)
        event.event_details = event_details
        event.id = 1
        event.created_by = 503
        event.created_on = MagicMock()
        event.created_on.strftime.return_value = "2024-06-01T00:00:00.000000Z"

        session = MagicMock()
        session.get.side_effect = lambda cls, pk: (
            agreement if pk == agreement.id else _make_user("Steve Tekell", user_id=pk) if pk == 503 else None
        )
        with patch("models.agreement_history.add_history_events") as mock_add:
            agreement_history_trigger_func(event, session, _make_user("System User", user_id=1), dry_run=True)
        (history_events, _), _ = mock_add.call_args
        return history_events

    def test_create_bli_draft_on_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "CREATE_BLI",
            {"new_bli": {"agreement_id": agreement.id, "id": 42, "status": "DRAFT"}},
            agreement,
        )
        assert AWARDED_NOTICE not in events[0].history_message

    def test_create_bli_planned_on_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "CREATE_BLI",
            {"new_bli": {"agreement_id": agreement.id, "id": 42, "status": "PLANNED"}},
            agreement,
        )
        assert events[0].history_message.endswith(AWARDED_NOTICE)

    def test_delete_bli_draft_on_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "DELETE_BLI",
            {"deleted_bli": {"agreement_id": agreement.id, "id": 42, "status": "DRAFT"}},
            agreement,
        )
        assert AWARDED_NOTICE not in events[0].history_message

    def test_delete_bli_planned_on_awarded_agreement_gets_notice(self):
        """Only reachable via a super-user bypass, since a Planned/Executing delete
        otherwise routes through a change request."""
        agreement = _make_agreement(True)
        events = self._run(
            "DELETE_BLI",
            {"deleted_bli": {"agreement_id": agreement.id, "id": 42, "status": "PLANNED"}},
            agreement,
        )
        assert events[0].history_message.endswith(AWARDED_NOTICE)

    def test_create_grant_number_on_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "CREATE_GRANT_NUMBER",
            {"new_gn": {"agreement_id": agreement.id, "display_name": "Grant 2"}},
            agreement,
        )
        assert AWARDED_NOTICE not in events[0].history_message

    def test_delete_grant_number_on_awarded_agreement_has_no_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "DELETE_GRANT_NUMBER",
            {"grant_number": {"agreement_id": agreement.id, "display_name": "Grant 2"}},
            agreement,
        )
        assert AWARDED_NOTICE not in events[0].history_message

    def test_create_services_component_on_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "CREATE_SERVICES_COMPONENT",
            {"new_sc": {"agreement_id": agreement.id, "display_name": "SC2"}},
            agreement,
        )
        assert events[0].history_message.endswith(AWARDED_NOTICE)

    def test_delete_services_component_on_awarded_agreement_gets_notice(self):
        agreement = _make_agreement(True)
        events = self._run(
            "DELETE_SERVICES_COMPONENT",
            {"service_component": {"agreement_id": agreement.id, "display_name": "SC2"}},
            agreement,
        )
        assert events[0].history_message.endswith(AWARDED_NOTICE)

    def test_team_member_added_on_awarded_agreement_has_no_notice(self):
        """Team member changes dropped the notice in the updated Figma design."""
        agreement = _make_agreement(True)
        events = self._run(
            "UPDATE_AGREEMENT",
            {
                "agreement_updates": {
                    "owner_id": agreement.id,
                    "changes": {},
                    "team_member_changes": {"user_ids_added": [503], "user_ids_removed": []},
                }
            },
            agreement,
        )
        assert AWARDED_NOTICE not in events[0].history_message

    def test_aln_number_added_on_awarded_agreement_has_no_notice(self):
        """ALN number changes dropped the notice in the updated Figma design."""
        agreement = _make_agreement(True)
        events = self._run(
            "UPDATE_AGREEMENT",
            {
                "agreement_updates": {
                    "owner_id": agreement.id,
                    "changes": {},
                    "aln_number_changes": {"aln_numbers_added": ["93.320"], "aln_numbers_removed": []},
                }
            },
            agreement,
        )
        assert AWARDED_NOTICE not in events[0].history_message
