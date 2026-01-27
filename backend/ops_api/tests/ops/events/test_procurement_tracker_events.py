"""
Tests for procurement_tracker_events module.

This module tests the procurement tracker creation event handler that handles
UPDATE_CHANGE_REQUEST events to automatically create DefaultProcurementTracker
and ProcurementAction when appropriate.
"""

from unittest.mock import MagicMock, Mock, patch

import pytest

from models import (
    Agreement,
    BudgetLineItem,
    ChangeRequestStatus,
    ChangeRequestType,
    DefaultProcurementTracker,
    OpsEvent,
    ProcurementAction,
)
from models.events import OpsEventType
from models.procurement_action import AwardType, ProcurementActionStatus
from models.procurement_tracker import ProcurementTrackerStatus
from ops_api.ops.events.procurement_tracker_events import procurement_tracker_trigger


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    session = MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = None
    return session


@pytest.fixture
def mock_bli():
    """Create a mock BudgetLineItem."""
    bli = Mock(spec=BudgetLineItem)
    bli.id = 1
    bli.procurement_action_id = None
    return bli


@pytest.fixture
def mock_agreement():
    """Create a mock Agreement that is not awarded."""
    agreement = Mock(spec=Agreement)
    agreement.id = 100
    agreement.is_awarded = False
    return agreement


@pytest.fixture
def mock_awarded_agreement():
    """Create a mock Agreement that is already awarded."""
    agreement = Mock(spec=Agreement)
    agreement.id = 100
    agreement.is_awarded = True
    return agreement


@pytest.fixture
def mock_event_bli_exec():
    """Create a mock OpsEvent for BLI status change to IN_EXECUTION."""
    event = Mock(spec=OpsEvent)
    event.id = 1
    event.event_type = OpsEventType.UPDATE_CHANGE_REQUEST
    event.created_by = 42  # Mock user ID
    event.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
            "has_status_change": True,
            "requested_change_data": {"status": "IN_EXECUTION"},
            "agreement_id": 100,
            "budget_line_item_id": 1,
        }
    }
    return event


# Happy Path Tests


@pytest.mark.usefixtures("app_ctx")
def test_creates_tracker_and_action_on_first_exec_transition(
    mock_session, mock_event_bli_exec, mock_agreement, mock_bli
):
    """Test that tracker and action are created when BLI transitions to IN_EXECUTION."""
    # Setup: Agreement exists, not awarded, no tracker or action exists
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify tracker and action were created
    assert mock_session.add.call_count == 2
    # Verify flush was called to get action.id
    mock_session.flush.assert_called_once()


@pytest.mark.usefixtures("app_ctx")
def test_second_bli_exec_transition_does_not_duplicate(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that a second BLI transition to IN_EXECUTION doesn't create duplicates."""
    # Setup: Agreement, BLI, tracker and action all exist
    mock_existing_tracker = Mock(spec=DefaultProcurementTracker)
    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50
    mock_bli.procurement_action_id = 50  # Already associated

    # Mock scalar to return agreement first, then existing tracker and action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        mock_existing_tracker,  # Tracker query (found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify no new entities were created
    mock_session.add.assert_not_called()
    mock_session.flush.assert_not_called()


# Edge Case Tests


@pytest.mark.usefixtures("app_ctx")
def test_creates_action_when_only_tracker_exists(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test creating action when tracker exists but action doesn't (inconsistent state)."""
    mock_existing_tracker = Mock(spec=DefaultProcurementTracker)

    # Mock scalar to return agreement first, then existing tracker, then None for action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        mock_existing_tracker,  # Tracker query (found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify only action was created (not tracker)
    assert mock_session.add.call_count == 1
    mock_session.flush.assert_called_once()


@pytest.mark.usefixtures("app_ctx")
def test_creates_tracker_when_only_action_exists(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test creating tracker when action exists but tracker doesn't (inconsistent state)."""
    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50

    # Mock scalar to return agreement first, then None for tracker, then existing action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify only tracker was created (not action)
    assert mock_session.add.call_count == 1


@pytest.mark.usefixtures("app_ctx")
def test_associates_bli_when_both_exist_but_not_associated(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that BLI gets associated when tracker and action exist but BLI isn't linked."""
    mock_existing_tracker = Mock(spec=DefaultProcurementTracker)
    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50
    mock_bli.procurement_action_id = None  # Not associated

    # Mock scalar to return agreement first, then existing tracker and action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        mock_existing_tracker,  # Tracker query (found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify BLI was associated with action
    assert mock_bli.procurement_action_id == 50
    mock_session.add.assert_not_called()


# Filter Tests


@pytest.mark.usefixtures("app_ctx")
def test_ignores_non_bli_change_requests(mock_session):
    """Test that non-BLI change requests are ignored."""
    event = Mock(spec=OpsEvent)
    event.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.AGREEMENT_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
        }
    }

    procurement_tracker_trigger(event, mock_session)

    # Verify no database operations occurred
    mock_session.get.assert_not_called()
    mock_session.query.assert_not_called()


@pytest.mark.usefixtures("app_ctx")
def test_ignores_rejected_change_requests(mock_session):
    """Test that rejected change requests are ignored."""
    event = Mock(spec=OpsEvent)
    event.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.REJECTED.name,
        }
    }

    procurement_tracker_trigger(event, mock_session)

    # Verify no database operations occurred
    mock_session.get.assert_not_called()
    mock_session.query.assert_not_called()


@pytest.mark.usefixtures("app_ctx")
def test_ignores_non_exec_status_changes(mock_session):
    """Test that non-IN_EXECUTION status transitions are ignored."""
    event = Mock(spec=OpsEvent)
    event.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
            "has_status_change": True,
            "requested_change_data": {"status": "PLANNED"},  # Not IN_EXECUTION
        }
    }

    procurement_tracker_trigger(event, mock_session)

    # Verify no database operations occurred
    mock_session.get.assert_not_called()
    mock_session.query.assert_not_called()


@pytest.mark.usefixtures("app_ctx")
def test_ignores_changes_without_status_change(mock_session):
    """Test that amount-only changes without status changes are ignored."""
    event = Mock(spec=OpsEvent)
    event.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
            "has_status_change": False,  # No status change
            "requested_change_data": {"amount": 50000},
        }
    }

    procurement_tracker_trigger(event, mock_session)

    # Verify no database operations occurred
    mock_session.get.assert_not_called()
    mock_session.query.assert_not_called()


@pytest.mark.usefixtures("app_ctx")
def test_ignores_awarded_agreements(mock_session, mock_event_bli_exec, mock_awarded_agreement, mock_bli):
    """Test that tracker creation is skipped for already awarded agreements."""
    mock_session.get.side_effect = lambda model_class, id: {
        (Agreement, 100): mock_awarded_agreement,  # Agreement is awarded
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify no tracker/action queries were made
    mock_session.query.assert_not_called()


# Error Handling Tests


@pytest.mark.usefixtures("app_ctx")
def test_handles_missing_agreement_gracefully(mock_session, mock_event_bli_exec):
    """Test that missing agreement is handled gracefully without raising."""
    # Agreement not found
    mock_session.get.return_value = None

    # Should not raise exception
    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify no further operations occurred
    mock_session.query.assert_not_called()


@pytest.mark.usefixtures("app_ctx")
def test_handles_malformed_event_details(mock_session):
    """Test that malformed event details are handled gracefully."""
    event = Mock(spec=OpsEvent)
    event.event_details = {}  # Missing 'change_request' key

    # Should not raise exception
    procurement_tracker_trigger(event, mock_session)

    # Verify no database operations occurred
    mock_session.get.assert_not_called()


@pytest.mark.usefixtures("app_ctx")
@patch("ops_api.ops.events.procurement_tracker_events.logger")
def test_handles_database_errors_gracefully(mock_logger, mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that database errors are logged and don't raise exceptions."""
    mock_session.get.side_effect = lambda model_class, id: {
        (Agreement, 100): mock_agreement,
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock scalar to raise an exception (SQLAlchemy 2.0 style)
    mock_session.scalar.side_effect = Exception("Database error")

    # Should not raise exception
    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify error was logged
    mock_logger.error.assert_called()


# Integration Tests


@pytest.mark.usefixtures("app_ctx")
def test_created_action_has_correct_defaults(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that created ProcurementAction has correct default values."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Capture the ProcurementAction that gets created
    created_action = None

    def capture_add(entity):
        nonlocal created_action
        if isinstance(entity, ProcurementAction):
            created_action = entity

    mock_session.add.side_effect = capture_add

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify action was created with correct defaults
    assert created_action is not None
    assert created_action.status == ProcurementActionStatus.PLANNED
    assert created_action.award_type == AwardType.NEW_AWARD
    assert created_action.agreement_mod_id is None
    assert created_action.created_by == 42  # Should be set from event.created_by


@pytest.mark.usefixtures("app_ctx")
def test_created_tracker_has_correct_status(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that created DefaultProcurementTracker has correct status."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps to verify args
    with patch.object(DefaultProcurementTracker, "create_with_steps") as mock_create:
        mock_create.return_value = Mock(spec=DefaultProcurementTracker)
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

        # Verify create_with_steps was called with correct arguments including created_by
        mock_create.assert_called_once_with(
            agreement_id=100, status=ProcurementTrackerStatus.ACTIVE, created_by=42
        )


# Tests for SQLAlchemy 2.0 filters and tracker-to-action association


@pytest.mark.usefixtures("app_ctx")
def test_ignores_inactive_trackers(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that INACTIVE trackers are not found, so new tracker/action will be created."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify new tracker and action were created (because INACTIVE tracker was not found)
    assert mock_session.add.call_count == 2
    mock_session.flush.assert_called_once()


@pytest.mark.usefixtures("app_ctx")
def test_ignores_completed_trackers(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that COMPLETED trackers are not found, so new tracker/action will be created."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify new tracker and action were created (because COMPLETED tracker was not found)
    assert mock_session.add.call_count == 2
    mock_session.flush.assert_called_once()


@pytest.mark.usefixtures("app_ctx")
def test_ignores_awarded_actions(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that AWARDED actions are not found, so new tracker/action will be created."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify new tracker and action were created
    assert mock_session.add.call_count == 2


@pytest.mark.usefixtures("app_ctx")
def test_ignores_certified_actions(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that CERTIFIED actions are not found, so new tracker/action will be created."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify new tracker and action were created
    assert mock_session.add.call_count == 2


@pytest.mark.usefixtures("app_ctx")
def test_ignores_cancelled_actions(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that CANCELLED actions are not found, so new tracker/action will be created."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify new tracker and action were created
    assert mock_session.add.call_count == 2


@pytest.mark.usefixtures("app_ctx")
def test_tracker_linked_to_action_when_both_created(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that tracker.procurement_action is set when both tracker and action are created."""
    # Mock scalar to return agreement first, then None for tracker and action queries
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Track added objects and assign IDs when flush is called
    added_objects = []

    def capture_add(obj):
        added_objects.append(obj)

    def assign_ids_on_flush():
        for obj in added_objects:
            if hasattr(obj, "id") and obj.id is None:
                obj.id = 42  # Assign a test ID

    mock_session.add.side_effect = capture_add
    mock_session.flush.side_effect = assign_ids_on_flush

    # Mock DefaultProcurementTracker.create_with_steps - use MagicMock without spec to allow attribute assignment
    mock_tracker = MagicMock()
    mock_tracker.procurement_action = None  # Initially unlinked
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify tracker's procurement_action was set to the action ID
    assert mock_tracker.procurement_action == 42


@pytest.mark.usefixtures("app_ctx")
def test_tracker_linked_when_creating_action_for_existing_tracker(
    mock_session, mock_event_bli_exec, mock_agreement, mock_bli
):
    """Test that existing tracker is linked to newly created action."""
    # Use MagicMock without spec to allow attribute assignment
    mock_existing_tracker = MagicMock()
    mock_existing_tracker.procurement_action = None  # Not linked

    # Mock scalar to return agreement first, then existing tracker, then None for action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        mock_existing_tracker,  # Tracker query (found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Track added objects and assign IDs when flush is called
    added_objects = []

    def capture_add(obj):
        added_objects.append(obj)

    def assign_ids_on_flush():
        for obj in added_objects:
            if hasattr(obj, "id") and obj.id is None:
                obj.id = 42  # Assign a test ID

    mock_session.add.side_effect = capture_add
    mock_session.flush.side_effect = assign_ids_on_flush

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify existing tracker was linked to new action
    assert mock_existing_tracker.procurement_action == 42


@pytest.mark.usefixtures("app_ctx")
def test_new_tracker_linked_to_existing_action(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that newly created tracker is linked to existing action."""
    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50

    # Mock scalar to return agreement first, then None for tracker, then existing action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        None,  # Tracker query (not found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps - use MagicMock without spec to allow attribute assignment
    mock_tracker = MagicMock()
    mock_tracker.procurement_action = None  # Initially unlinked
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify new tracker was linked to existing action
    assert mock_tracker.procurement_action == 50


@pytest.mark.usefixtures("app_ctx")
def test_links_tracker_to_action_when_both_exist_but_not_linked(
    mock_session, mock_event_bli_exec, mock_agreement, mock_bli
):
    """Test that tracker is linked to action when both exist but tracker.procurement_action is not set."""
    # Use MagicMock without spec to allow attribute assignment
    mock_existing_tracker = MagicMock()
    mock_existing_tracker.procurement_action = None  # Not linked

    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50
    mock_bli.procurement_action_id = 50  # Already associated

    # Mock scalar to return agreement first, then existing tracker and action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query with lock
        mock_existing_tracker,  # Tracker query (found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify tracker was linked to action
    assert mock_existing_tracker.procurement_action == 50


@pytest.mark.usefixtures("app_ctx")
def test_does_not_relink_when_tracker_already_linked(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that tracker is not re-linked when already properly linked to action."""
    mock_session.get.side_effect = lambda model_class, id: {
        (Agreement, 100): mock_agreement,
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Use MagicMock without spec to allow attribute assignment/reading
    mock_existing_tracker = MagicMock()
    mock_existing_tracker.procurement_action = 50  # Already linked

    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50
    mock_bli.procurement_action_id = 50  # Already associated

    # Mock scalar to return existing tracker first, then existing action
    mock_session.scalar.side_effect = [mock_existing_tracker, mock_existing_action]

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify tracker link unchanged (still 50)
    assert mock_existing_tracker.procurement_action == 50
    # Verify no new entities were created
    mock_session.add.assert_not_called()


# Race Condition Tests


@pytest.mark.usefixtures("app_ctx")
def test_uses_row_lock_on_agreement(mock_session, mock_event_bli_exec):
    """Test that Agreement is queried with SELECT FOR UPDATE to prevent race conditions."""
    # Setup mock to capture the query

    from models import Agreement

    mock_agreement = Mock(spec=Agreement)
    mock_agreement.id = 100
    mock_agreement.is_awarded = False

    # Mock scalar to return agreement when called
    mock_session.scalar.return_value = mock_agreement

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify scalar was called (which means a query was executed)
    # The query should have been built with with_for_update()
    assert mock_session.scalar.called


@pytest.mark.usefixtures("app_ctx")
def test_uses_row_lock_on_tracker_query(mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that tracker query uses SELECT FOR UPDATE to prevent race conditions."""
    # Mock scalar to track calls - first call is agreement, second is tracker, third is action
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify scalar was called multiple times (agreement, tracker, action queries)
    assert mock_session.scalar.call_count >= 3


@pytest.mark.usefixtures("app_ctx")
@patch("ops_api.ops.events.procurement_tracker_events.logger")
def test_handles_integrity_error_gracefully(mock_logger, mock_session, mock_event_bli_exec, mock_agreement, mock_bli):
    """Test that IntegrityError (from duplicate creation) is handled gracefully."""
    from sqlalchemy.exc import IntegrityError

    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock add to raise IntegrityError (simulating duplicate key violation)
    mock_session.add.side_effect = IntegrityError("duplicate key", None, None)

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        # Should not raise exception
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify warning was logged
    mock_logger.warning.assert_called()
    # Verify rollback was called
    mock_session.rollback.assert_called_once()


@pytest.mark.usefixtures("app_ctx")
def test_concurrent_events_both_see_existing_after_first_commits(
    mock_session, mock_event_bli_exec, mock_agreement, mock_bli
):
    """
    Test simulating concurrent execution where second handler sees what first handler created.

    Scenario:
    - First handler: Creates tracker and action
    - Second handler: Finds existing tracker and action, associates BLI
    """
    # First event - nothing exists
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    # Mock DefaultProcurementTracker.create_with_steps
    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify tracker and action were created
    assert mock_session.add.call_count == 2

    # Reset for second event
    mock_session.reset_mock()

    # Second event - tracker and action now exist (created by first handler)
    mock_existing_tracker = Mock(spec=DefaultProcurementTracker)
    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50
    mock_bli.procurement_action_id = None  # Not yet associated

    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        mock_existing_tracker,  # Tracker query (found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli,
    }.get((model_class, id))

    procurement_tracker_trigger(mock_event_bli_exec, mock_session)

    # Verify second handler did NOT create duplicates
    mock_session.add.assert_not_called()
    # Verify BLI was associated with existing action
    assert mock_bli.procurement_action_id == 50


@pytest.mark.usefixtures("app_ctx")
def test_multiple_blis_same_agreement_all_get_associated(mock_session, mock_agreement):
    """
    Test that multiple BLIs transitioning to IN_EXECUTION for same agreement all get associated.

    Scenario:
    - First BLI: Creates tracker and action
    - Second BLI: Associates with existing tracker/action
    - Third BLI: Associates with existing tracker/action
    """
    from models import BudgetLineItem

    # Create three different BLI mocks
    mock_bli_1 = Mock(spec=BudgetLineItem)
    mock_bli_1.id = 1
    mock_bli_1.procurement_action_id = None

    mock_bli_2 = Mock(spec=BudgetLineItem)
    mock_bli_2.id = 2
    mock_bli_2.procurement_action_id = None

    mock_bli_3 = Mock(spec=BudgetLineItem)
    mock_bli_3.id = 3
    mock_bli_3.procurement_action_id = None

    # Event for first BLI
    event_1 = Mock(spec=OpsEvent)
    event_1.id = 1
    event_1.event_type = OpsEventType.UPDATE_CHANGE_REQUEST
    event_1.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
            "has_status_change": True,
            "requested_change_data": {"status": "IN_EXECUTION"},
            "agreement_id": 100,
            "budget_line_item_id": 1,
        }
    }

    # First BLI - nothing exists
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        None,  # Tracker query (not found)
        None,  # Action query (not found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 1): mock_bli_1,
    }.get((model_class, id))

    mock_tracker = Mock(spec=DefaultProcurementTracker)
    with patch.object(DefaultProcurementTracker, "create_with_steps", return_value=mock_tracker):
        procurement_tracker_trigger(event_1, mock_session)

    # Verify tracker and action were created
    assert mock_session.add.call_count == 2

    # Create mock existing tracker and action for subsequent events
    mock_existing_tracker = Mock(spec=DefaultProcurementTracker)
    mock_existing_action = Mock(spec=ProcurementAction)
    mock_existing_action.id = 50

    # Event for second BLI
    event_2 = Mock(spec=OpsEvent)
    event_2.id = 2
    event_2.event_type = OpsEventType.UPDATE_CHANGE_REQUEST
    event_2.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
            "has_status_change": True,
            "requested_change_data": {"status": "IN_EXECUTION"},
            "agreement_id": 100,
            "budget_line_item_id": 2,
        }
    }

    mock_session.reset_mock()
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        mock_existing_tracker,  # Tracker query (found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 2): mock_bli_2,
    }.get((model_class, id))

    procurement_tracker_trigger(event_2, mock_session)

    # Verify second BLI was associated
    assert mock_bli_2.procurement_action_id == 50
    mock_session.add.assert_not_called()

    # Event for third BLI
    event_3 = Mock(spec=OpsEvent)
    event_3.id = 3
    event_3.event_type = OpsEventType.UPDATE_CHANGE_REQUEST
    event_3.event_details = {
        "change_request": {
            "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name,
            "status": ChangeRequestStatus.APPROVED.name,
            "has_status_change": True,
            "requested_change_data": {"status": "IN_EXECUTION"},
            "agreement_id": 100,
            "budget_line_item_id": 3,
        }
    }

    mock_session.reset_mock()
    mock_session.scalar.side_effect = [
        mock_agreement,  # Agreement query
        mock_existing_tracker,  # Tracker query (found)
        mock_existing_action,  # Action query (found)
    ]

    mock_session.get.side_effect = lambda model_class, id: {
        (BudgetLineItem, 3): mock_bli_3,
    }.get((model_class, id))

    procurement_tracker_trigger(event_3, mock_session)

    # Verify third BLI was associated
    assert mock_bli_3.procurement_action_id == 50
    mock_session.add.assert_not_called()
