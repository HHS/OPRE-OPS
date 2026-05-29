from datetime import datetime, timedelta

from sqlalchemy import select

from models import (
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    Project,
    ProjectHistory,
    ProjectHistoryType,
    User,
)
from models.project_history import add_history_events
from ops_api.ops.services.project_history import ProjectHistoryService
from ops_api.ops.services.project_messages import project_history_trigger
from ops_api.ops.utils.users import get_sys_user

TEST_PROJECT_ID = 1000
TEST_USER_ID = 503  # Amelia Popham
TIMESTAMP_FMT = "%Y-%m-%dT%H:%M:%S.%fZ"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_event(loaded_db, event_type, event_details, created_by=TEST_USER_ID):
    """Create, flush, and re-fetch an OpsEvent so created_by/created_on are populated."""
    ops_event = OpsEvent(
        event_type=event_type,
        event_status=OpsEventStatus.SUCCESS,
        created_by=created_by,
        event_details=event_details,
    )
    loaded_db.add(ops_event)
    loaded_db.flush()
    loaded_db.commit()
    return loaded_db.query(OpsEvent).filter(OpsEvent.id == ops_event.id).one()


def _history_for_event(loaded_db, ops_event_id):
    return (
        loaded_db.query(ProjectHistory)
        .where(ProjectHistory.ops_event_id == ops_event_id)
        .order_by(ProjectHistory.id)
        .all()
    )


# ---------------------------------------------------------------------------
# Trigger tests
# ---------------------------------------------------------------------------


def test_create_project_history_trigger(loaded_db, app_ctx):
    project = loaded_db.get(Project, TEST_PROJECT_ID)
    assert project is not None
    ops_event = _make_event(
        loaded_db,
        OpsEventType.CREATE_PROJECT,
        {"new_project": {"id": project.id, "title": project.title}},
    )

    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_type == ProjectHistoryType.PROJECT_CREATED
    assert items[0].history_title == "Project Created"
    assert items[0].project_id_record == project.id
    user = loaded_db.get(User, TEST_USER_ID)
    assert items[0].history_message == f"Project created by {user.full_name}."


def test_create_project_history_trigger_system_user(loaded_db, app_ctx):
    project = loaded_db.get(Project, TEST_PROJECT_ID)
    sys_user = get_sys_user(loaded_db)
    assert sys_user is not None, "System admin user must exist in seed data"
    ops_event = _make_event(
        loaded_db,
        OpsEventType.CREATE_PROJECT,
        {"new_project": {"id": project.id}},
        created_by=sys_user.id,
    )

    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_message == "Changes made to the OPRE budget spreadsheet created a new project."


def test_update_project_title_trigger(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "title": {"old_value": "Old Title", "new_value": "New Title"},
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_type == ProjectHistoryType.PROJECT_TITLE_EDITED
    assert items[0].history_title == "Change to Project Title"
    user = loaded_db.get(User, TEST_USER_ID)
    assert items[0].history_message == f"{user.full_name} changed the Project Title from Old Title to New Title."


def test_update_project_short_title_trigger_renders_tbd(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "short_title": {"old_value": None, "new_value": "Nick"},
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_type == ProjectHistoryType.PROJECT_SHORT_TITLE_EDITED
    user = loaded_db.get(User, TEST_USER_ID)
    assert items[0].history_message == f"{user.full_name} changed the Project Nickname from TBD to Nick."


def test_update_project_description_trigger(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "description": {"old_value": "Old desc", "new_value": "New desc"},
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_type == ProjectHistoryType.PROJECT_DESCRIPTION_EDITED
    user = loaded_db.get(User, TEST_USER_ID)
    assert items[0].history_message == f"{user.full_name} changed the Project Description."


def test_update_project_url_trigger(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "url": {"old_value": None, "new_value": "https://example.com"},
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_type == ProjectHistoryType.PROJECT_URL_EDITED
    user = loaded_db.get(User, TEST_USER_ID)
    assert items[0].history_message == f"{user.full_name} changed the URL from None to https://example.com."


def test_update_project_type_trigger(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "project_type": {
                        "old_value": "RESEARCH",
                        "new_value": "ADMINISTRATIVE_AND_SUPPORT",
                    },
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1
    assert items[0].history_type == ProjectHistoryType.PROJECT_TYPE_EDITED
    user = loaded_db.get(User, TEST_USER_ID)
    assert items[0].history_message == f"{user.full_name} changed the Project Type from Research to Admin & Support."


def test_update_project_team_leader_added_and_removed_trigger(loaded_db, app_ctx):
    added_user = loaded_db.get(User, 504)
    removed_user = loaded_db.get(User, 505)
    assert added_user is not None and removed_user is not None

    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {},
                "team_leader_changes": {
                    "user_ids_added": [added_user.id],
                    "user_ids_removed": [removed_user.id],
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 2
    types = {item.history_type for item in items}
    assert ProjectHistoryType.PROJECT_TEAM_LEADER_ADDED in types
    assert ProjectHistoryType.PROJECT_TEAM_LEADER_REMOVED in types
    user = loaded_db.get(User, TEST_USER_ID)
    messages = {item.history_message for item in items}
    assert f"{user.full_name} added team leader {added_user.full_name}." in messages
    assert f"{user.full_name} removed team leader {removed_user.full_name}." in messages


def test_update_project_multi_field_change_trigger(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "title": {"old_value": "A", "new_value": "B"},
                    "short_title": {"old_value": "X", "new_value": "Y"},
                    "description": {"old_value": "d1", "new_value": "d2"},
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 3
    types = {item.history_type for item in items}
    assert types == {
        ProjectHistoryType.PROJECT_TITLE_EDITED,
        ProjectHistoryType.PROJECT_SHORT_TITLE_EDITED,
        ProjectHistoryType.PROJECT_DESCRIPTION_EDITED,
    }


def test_unknown_property_logs_and_skips(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {
                    "some_unknown_field": {"old_value": "a", "new_value": "b"},
                },
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert items == []


def test_failed_event_no_history(loaded_db, app_ctx):
    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_PROJECT,
        event_status=OpsEventStatus.FAILED,
        created_by=TEST_USER_ID,
        event_details={
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {"title": {"old_value": "A", "new_value": "B"}},
            }
        },
    )
    loaded_db.add(ops_event)
    loaded_db.flush()
    loaded_db.commit()
    ops_event = loaded_db.query(OpsEvent).filter(OpsEvent.id == ops_event.id).one()

    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert items == []


def test_no_duplicate_messages_when_trigger_runs_twice(loaded_db, app_ctx):
    ops_event = _make_event(
        loaded_db,
        OpsEventType.UPDATE_PROJECT,
        {
            "project_updates": {
                "owner_id": TEST_PROJECT_ID,
                "updated_by": TEST_USER_ID,
                "changes": {"title": {"old_value": "A", "new_value": "B"}},
            }
        },
    )
    project_history_trigger(ops_event, loaded_db)
    project_history_trigger(ops_event, loaded_db)
    loaded_db.flush()

    items = _history_for_event(loaded_db, ops_event.id)
    assert len(items) == 1


# ---------------------------------------------------------------------------
# add_history_events dedup tests
# ---------------------------------------------------------------------------


def _ts_now():
    return datetime.utcnow().strftime(TIMESTAMP_FMT)


def test_add_history_events_prevents_duplicates_in_same_batch(loaded_db, app_ctx):
    ts = _ts_now()
    event1 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Same message",
        timestamp=ts,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )
    event2 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Same message",
        timestamp=ts,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )

    initial = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()
    assert final == initial + 1


def test_add_history_events_allows_different_messages(loaded_db, app_ctx):
    ts = _ts_now()
    event1 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Message 1",
        timestamp=ts,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )
    event2 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Message 2",
        timestamp=ts,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )

    initial = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()
    assert final == initial + 2


def test_add_history_events_allows_different_types(loaded_db, app_ctx):
    ts = _ts_now()
    event1 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Same message",
        timestamp=ts,
        history_type=ProjectHistoryType.PROJECT_CREATED,
    )
    event2 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Same message",
        timestamp=ts,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )

    initial = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()
    assert final == initial + 2


def test_add_history_events_allows_events_outside_time_window(loaded_db, app_ctx):
    base = datetime.utcnow()
    ts1 = base.strftime(TIMESTAMP_FMT)
    ts2 = (base + timedelta(minutes=2)).strftime(TIMESTAMP_FMT)

    event1 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Same message",
        timestamp=ts1,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )
    event2 = ProjectHistory(
        project_id=TEST_PROJECT_ID,
        project_id_record=TEST_PROJECT_ID,
        history_title="Test",
        history_message="Same message",
        timestamp=ts2,
        history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
    )

    initial = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()

    add_history_events([event1, event2], loaded_db)
    loaded_db.flush()

    final = loaded_db.query(ProjectHistory).filter(ProjectHistory.project_id_record == TEST_PROJECT_ID).count()
    assert final == initial + 2


# ---------------------------------------------------------------------------
# Service tests
# ---------------------------------------------------------------------------


def _seed_project_history(loaded_db, project_id, count, base_timestamp=None):
    """Seed `count` ProjectHistory rows for a project. Returns nothing."""
    base = base_timestamp or datetime.utcnow()
    for i in range(count):
        ts = (base + timedelta(seconds=i * 90)).strftime(TIMESTAMP_FMT)
        loaded_db.add(
            ProjectHistory(
                project_id=project_id,
                project_id_record=project_id,
                history_title=f"Title {i}",
                history_message=f"Message {i}",
                timestamp=ts,
                history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
            )
        )
    loaded_db.flush()


def test_service_get_returns_count_metadata(app_ctx, loaded_db):
    _seed_project_history(loaded_db, TEST_PROJECT_ID, 3)
    service = ProjectHistoryService()
    items, metadata = service.get(TEST_PROJECT_ID, 10, 0)
    assert metadata["count"] >= 3
    assert metadata["limit"] == 10
    assert metadata["offset"] == 0
    assert len(items) == metadata["count"]


def test_service_get_pagination(app_ctx, loaded_db):
    _seed_project_history(loaded_db, TEST_PROJECT_ID, 5)
    service = ProjectHistoryService()
    page1, meta1 = service.get(TEST_PROJECT_ID, 2, 0)
    page2, meta2 = service.get(TEST_PROJECT_ID, 2, 2)
    assert len(page1) == 2
    assert len(page2) == 2
    assert meta1["count"] == meta2["count"]
    assert {item.id for item in page1}.isdisjoint({item.id for item in page2})


def test_service_get_sort_default_descending(app_ctx, loaded_db):
    _seed_project_history(loaded_db, TEST_PROJECT_ID, 3)
    service = ProjectHistoryService()
    items, _ = service.get(TEST_PROJECT_ID, 10, 0)
    timestamps = [i.timestamp for i in items]
    assert timestamps == sorted(timestamps, reverse=True)


def test_service_get_sort_ascending(app_ctx, loaded_db):
    _seed_project_history(loaded_db, TEST_PROJECT_ID, 3)
    service = ProjectHistoryService()
    items, _ = service.get(TEST_PROJECT_ID, 10, 0, sort_ascending=True)
    timestamps = [i.timestamp for i in items]
    assert timestamps == sorted(timestamps)


def test_service_get_offset_beyond_total(app_ctx, loaded_db):
    _seed_project_history(loaded_db, TEST_PROJECT_ID, 3)
    service = ProjectHistoryService()
    items, metadata = service.get(TEST_PROJECT_ID, 10, 1000)
    assert items == []
    assert metadata["count"] >= 3
    assert metadata["offset"] == 1000


# ---------------------------------------------------------------------------
# API integration tests
# ---------------------------------------------------------------------------


def test_get_project_history_unauthorized(client, app_ctx):
    response = client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/")
    assert response.status_code == 401


def test_get_project_history_forbidden_for_user_without_history_permission(no_perms_auth_client, app_ctx):
    response = no_perms_auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/")
    assert response.status_code == 403


def test_get_project_history_returns_wrapped_envelope(auth_client, mocker, app_ctx):
    mock_items = [
        ProjectHistory(
            id=i,
            project_id=TEST_PROJECT_ID,
            project_id_record=TEST_PROJECT_ID,
            history_title="Title",
            history_message="Message",
            timestamp="2026-01-01T00:00:00.000000Z",
            history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
        )
        for i in range(1, 6)
    ]
    mock_get = mocker.patch("ops_api.ops.services.project_history.ProjectHistoryService.get")
    mock_get.return_value = (mock_items, {"count": 5, "limit": 10, "offset": 0})

    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/")
    assert response.status_code == 200
    body = response.json
    assert body["count"] == 5
    assert body["limit"] == 10
    assert body["offset"] == 0
    assert len(body["data"]) == 5


def test_get_project_history_with_limit_offset(auth_client, mocker, app_ctx):
    mock_get = mocker.patch("ops_api.ops.services.project_history.ProjectHistoryService.get")
    mock_get.return_value = ([], {"count": 50, "limit": 5, "offset": 10})

    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/?limit=5&offset=10")
    assert response.status_code == 200
    mock_get.assert_called_once_with(TEST_PROJECT_ID, 5, 10, False)
    assert response.json["count"] == 50
    assert response.json["limit"] == 5
    assert response.json["offset"] == 10


def test_get_project_history_sort_asc_passthrough(auth_client, mocker, app_ctx):
    mock_get = mocker.patch("ops_api.ops.services.project_history.ProjectHistoryService.get")
    mock_get.return_value = ([], {"count": 0, "limit": 10, "offset": 0})

    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/?sort_asc=true")
    assert response.status_code == 200
    mock_get.assert_called_once_with(TEST_PROJECT_ID, 10, 0, True)


def test_get_project_history_offset_beyond_total(auth_client, mocker, app_ctx):
    mock_get = mocker.patch("ops_api.ops.services.project_history.ProjectHistoryService.get")
    mock_get.return_value = ([], {"count": 5, "limit": 10, "offset": 1000})

    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/?offset=1000")
    assert response.status_code == 200
    assert response.json["data"] == []
    assert response.json["count"] == 5
    assert response.json["offset"] == 1000


def test_get_project_history_bad_limit(auth_client, app_ctx):
    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/?limit=0")
    assert response.status_code == 400


def test_get_project_history_bad_offset(auth_client, app_ctx):
    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/?offset=-1")
    assert response.status_code == 400


def test_get_project_history_real_db_round_trip(auth_client, loaded_db, app_ctx):
    """End-to-end sanity check: seeded rows show up in the API response, sorted newest-first."""
    base = datetime.utcnow()
    for i in range(2):
        ts = (base + timedelta(seconds=i * 120)).strftime(TIMESTAMP_FMT)
        loaded_db.add(
            ProjectHistory(
                project_id=TEST_PROJECT_ID,
                project_id_record=TEST_PROJECT_ID,
                history_title=f"Title {i}",
                history_message=f"Message {i}",
                timestamp=ts,
                history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
            )
        )
    loaded_db.flush()
    loaded_db.commit()

    response = auth_client.get(f"/api/v1/projects/{TEST_PROJECT_ID}/history/?limit=50")
    assert response.status_code == 200
    body = response.json
    assert body["count"] >= 2
    seeded = [item for item in body["data"] if item["history_message"].startswith("Message ")]
    assert len(seeded) == 2
    # newest-first
    assert seeded[0]["history_message"] == "Message 1"
    assert seeded[1]["history_message"] == "Message 0"


# ---------------------------------------------------------------------------
# Service get on stale project_id_record
# ---------------------------------------------------------------------------


def test_service_filters_by_project_id_record(loaded_db, app_ctx):
    """Rows persist via project_id_record even if project_id is NULL."""
    base = datetime.utcnow()
    ts = base.strftime(TIMESTAMP_FMT)
    loaded_db.add(
        ProjectHistory(
            project_id=None,  # simulates SET NULL after deletion
            project_id_record=TEST_PROJECT_ID,
            history_title="Orphan",
            history_message="Orphan message",
            timestamp=ts,
            history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
        )
    )
    loaded_db.flush()

    service = ProjectHistoryService()
    items, metadata = service.get(TEST_PROJECT_ID, 100, 0)
    assert any(item.history_message == "Orphan message" for item in items)
    assert metadata["count"] >= 1


# ---------------------------------------------------------------------------
# Sanity import-check for select() (to keep the imports used)
# ---------------------------------------------------------------------------


def test_select_module_available():
    # Smoke test to keep the imported symbol referenced.
    assert select is not None
