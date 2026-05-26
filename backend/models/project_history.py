from datetime import datetime
from enum import Enum, auto
from typing import List, Optional

from loguru import logger
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, Session, mapped_column

from models import (
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    Project,
    ProjectType,
    User,
)
from models.base import BaseModel


class ProjectHistoryType(Enum):
    PROJECT_CREATED = auto()
    PROJECT_TITLE_EDITED = auto()
    PROJECT_SHORT_TITLE_EDITED = auto()
    PROJECT_DESCRIPTION_EDITED = auto()
    PROJECT_URL_EDITED = auto()
    PROJECT_TYPE_EDITED = auto()
    PROJECT_TEAM_LEADER_ADDED = auto()
    PROJECT_TEAM_LEADER_REMOVED = auto()


class ProjectHistory(BaseModel):
    __tablename__ = "project_history"

    id: Mapped[int] = BaseModel.get_pk_column()
    project_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("project.id", ondelete="SET NULL"), nullable=True
    )
    project_id_record: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    ops_event_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("ops_event.id", ondelete="SET NULL"), nullable=True
    )
    history_title: Mapped[str]
    history_message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str]
    history_type: Mapped[ProjectHistoryType] = mapped_column(ENUM(ProjectHistoryType), nullable=True)


_PROJECT_TYPE_DISPLAY = {
    ProjectType.RESEARCH.name: "Research",
    ProjectType.ADMINISTRATIVE_AND_SUPPORT.name: "Admin & Support",
}


def _project_type_display(value) -> str:
    """Render a project type code (string or ProjectType) as a human-readable label."""
    if value is None:
        return "None"
    if isinstance(value, ProjectType):
        return _PROJECT_TYPE_DISPLAY.get(value.name, value.name)
    return _PROJECT_TYPE_DISPLAY.get(str(value), str(value))


def project_history_trigger_func(
    event: OpsEvent,
    session: Session,
    system_user: User,
    dry_run: bool = False,
) -> None:
    """Trigger function that builds ProjectHistory rows from CREATE_PROJECT and UPDATE_PROJECT events."""
    if event.event_status == OpsEventStatus.FAILED or event.event_status == OpsEventStatus.UNKNOWN:
        return

    logger.debug(f"Handling event {event.event_type} with details: {event.event_details}")
    assert session is not None

    event_user = session.get(User, event.created_by)
    if event_user is None:
        event_user = User(id=-1, full_name="Unknown User")
        logger.error(f"Event user for event {event.id} is None. Using placeholder user.")
    updated_by_system_user = system_user.id == event_user.id
    timestamp = event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    history_events: List[ProjectHistory] = []

    match event.event_type:
        case OpsEventType.CREATE_PROJECT:
            new_project = event.event_details.get("new_project") if event.event_details else None
            if new_project and new_project.get("id") is not None:
                project_id = new_project["id"]
                history_events.append(
                    ProjectHistory(
                        project_id=project_id,
                        project_id_record=project_id,
                        ops_event_id=event.id,
                        history_title="Project Created",
                        history_message=(
                            "Changes made to the OPRE budget spreadsheet created a new project."
                            if updated_by_system_user
                            else f"Project created by {event_user.full_name}."
                        ),
                        timestamp=timestamp,
                        history_type=ProjectHistoryType.PROJECT_CREATED,
                    )
                )
        case OpsEventType.UPDATE_PROJECT:
            project_updates = event.event_details.get("project_updates") if event.event_details else None
            if project_updates:
                owner_id = project_updates.get("owner_id")
                changes = project_updates.get("changes", {}) or {}
                for property_name, change in changes.items():
                    history_item = create_project_update_history_event(
                        property_name,
                        change.get("old_value"),
                        change.get("new_value"),
                        event_user,
                        timestamp,
                        owner_id,
                        event.id,
                        session,
                        system_user,
                    )
                    if history_item is not None:
                        history_events.append(history_item)

                team_leader_changes = project_updates.get("team_leader_changes") or {}
                for added_user_id in team_leader_changes.get("user_ids_added", []) or []:
                    added_user = session.get(User, added_user_id)
                    added_name = added_user.full_name if added_user else f"user {added_user_id}"
                    history_events.append(
                        ProjectHistory(
                            project_id=owner_id,
                            project_id_record=owner_id,
                            ops_event_id=event.id,
                            history_title="Change to Team Leaders",
                            history_message=f"{event_user.full_name} added team leader {added_name}.",
                            timestamp=timestamp,
                            history_type=ProjectHistoryType.PROJECT_TEAM_LEADER_ADDED,
                        )
                    )
                for removed_user_id in team_leader_changes.get("user_ids_removed", []) or []:
                    removed_user = session.get(User, removed_user_id)
                    removed_name = removed_user.full_name if removed_user else f"user {removed_user_id}"
                    history_events.append(
                        ProjectHistory(
                            project_id=owner_id,
                            project_id_record=owner_id,
                            ops_event_id=event.id,
                            history_title="Change to Team Leaders",
                            history_message=f"{event_user.full_name} removed team leader {removed_name}.",
                            timestamp=timestamp,
                            history_type=ProjectHistoryType.PROJECT_TEAM_LEADER_REMOVED,
                        )
                    )

    history_events = [e for e in history_events if e.project_id_record is not None]
    add_history_events(history_events, session)
    if not dry_run:
        session.commit()


def create_project_update_history_event(
    property_name: str,
    old_value,
    new_value,
    updated_by_user: User,
    updated_on: str,
    project_id: int,
    ops_event_id: int,
    session: Session,
    sys_user: User,
) -> Optional[ProjectHistory]:
    """Generate a ProjectHistory event for a single updated property. Returns None if the property is not handled."""
    updated_by_system_user = sys_user.id == updated_by_user.id

    project = session.get(Project, project_id) if project_id is not None else None
    project_id_for_fk = project.id if project else None

    match property_name:
        case "title":
            return ProjectHistory(
                project_id=project_id_for_fk,
                project_id_record=project_id,
                ops_event_id=ops_event_id,
                history_title="Change to Project Title",
                history_message=(
                    f"Changes made to the OPRE budget spreadsheet changed the Project Title from {old_value} to {new_value}."
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the Project Title from {old_value} to {new_value}."
                ),
                timestamp=updated_on,
                history_type=ProjectHistoryType.PROJECT_TITLE_EDITED,
            )
        case "short_title":
            old_short = old_value if old_value else "TBD"
            new_short = new_value if new_value else "TBD"
            return ProjectHistory(
                project_id=project_id_for_fk,
                project_id_record=project_id,
                ops_event_id=ops_event_id,
                history_title="Change to Project Nickname",
                history_message=(
                    f"Changes made to the OPRE budget spreadsheet changed the Project Nickname from {old_short} to {new_short}."
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the Project Nickname from {old_short} to {new_short}."
                ),
                timestamp=updated_on,
                history_type=ProjectHistoryType.PROJECT_SHORT_TITLE_EDITED,
            )
        case "description":
            return ProjectHistory(
                project_id=project_id_for_fk,
                project_id_record=project_id,
                ops_event_id=ops_event_id,
                history_title="Change to Description",
                history_message=(
                    "Changes made to the OPRE budget spreadsheet changed the Project Description."
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the Project Description."
                ),
                timestamp=updated_on,
                history_type=ProjectHistoryType.PROJECT_DESCRIPTION_EDITED,
            )
        case "url":
            old_url = old_value if old_value else "None"
            new_url = new_value if new_value else "None"
            return ProjectHistory(
                project_id=project_id_for_fk,
                project_id_record=project_id,
                ops_event_id=ops_event_id,
                history_title="Change to URL",
                history_message=(
                    f"Changes made to the OPRE budget spreadsheet changed the URL from {old_url} to {new_url}."
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the URL from {old_url} to {new_url}."
                ),
                timestamp=updated_on,
                history_type=ProjectHistoryType.PROJECT_URL_EDITED,
            )
        case "project_type":
            old_label = _project_type_display(old_value)
            new_label = _project_type_display(new_value)
            return ProjectHistory(
                project_id=project_id_for_fk,
                project_id_record=project_id,
                ops_event_id=ops_event_id,
                history_title="Change to Project Type",
                history_message=(
                    f"Changes made to the OPRE budget spreadsheet changed the Project Type from {old_label} to {new_label}."
                    if updated_by_system_user
                    else f"{updated_by_user.full_name} changed the Project Type from {old_label} to {new_label}."
                ),
                timestamp=updated_on,
                history_type=ProjectHistoryType.PROJECT_TYPE_EDITED,
            )
        case _:
            logger.info(
                f"{property_name} edited by {updated_by_user.full_name} from {old_value} to {new_value}"
            )
            return None


def add_history_events(events: List[ProjectHistory], session: Session) -> None:
    """Add ProjectHistory events to the session, skipping any that look like duplicates of existing rows."""
    for event in events:
        existing_items = (
            session.query(ProjectHistory)
            .where(ProjectHistory.project_id_record == event.project_id_record)
            .all()
        )

        for item in session.new:
            if isinstance(item, ProjectHistory) and item.project_id_record == event.project_id_record:
                existing_items.append(item)

        duplicate_found = False
        for item in existing_items:
            if (
                is_timespan_within_one_minute(event.timestamp, item.timestamp)
                and item.history_type == event.history_type
                and item.history_message == event.history_message
            ):
                duplicate_found = True
                break

        if not duplicate_found:
            session.add(event)


def is_timespan_within_one_minute(datetime_to_check: str, reference_datetime: str) -> bool:
    """Check if two ISO format timestamp strings are within one minute of each other."""
    try:
        datetime_to_check_dt = datetime.fromisoformat(datetime_to_check.replace("Z", "+00:00"))
        reference_datetime_dt = datetime.fromisoformat(reference_datetime.replace("Z", "+00:00"))
        difference = abs((datetime_to_check_dt - reference_datetime_dt).total_seconds())
        return difference <= 60
    except ValueError as e:
        logger.error(f"Error parsing timespan strings: {e}")
        return False
