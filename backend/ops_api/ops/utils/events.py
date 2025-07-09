from types import TracebackType
from typing import Optional, Type

from deepdiff import DeepDiff, parse_path
from flask import current_app, request
from flask_jwt_extended import current_user
from loguru import logger
from sqlalchemy.orm import Session
from werkzeug.exceptions import UnsupportedMediaType

from models.events import OpsEvent, OpsEventStatus, OpsEventType
from ops_api.ops.auth.utils import get_request_ip_address


class OpsEventHandler:
    def __init__(self, event_type: OpsEventType):
        self.metadata = {}
        self.event_type = event_type

    def __enter__(self):
        self.metadata.update(
            {
                "request.values": request.values,
                "request.headers": {k: v for k, v in request.headers},
                "request.remote_addr": get_request_ip_address(),
                "request.remote_user": request.remote_user,
            }
        )

        try:
            self.metadata["request.json"] = request.json
        except UnsupportedMediaType:
            if request.data:
                self.metadata["request.data"] = request.data

        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        if exc_val or not current_app.db_session.is_active:
            event_status = OpsEventStatus.FAILED
            self.metadata.update({"error_message": f"{exc_val}", "error_type": f"{exc_type}"})
        else:
            event_status = OpsEventStatus.SUCCESS

        current_user_id = None
        try:
            current_user_id = current_user.id if current_user else None
        except Exception as e:
            print(e)

        event = OpsEvent(
            event_type=self.event_type,
            event_status=event_status,
            event_details=self.metadata,
            created_by=current_user_id,
        )

        with Session(current_app.engine) as session:
            session.add(event)
            session.commit()
            current_app.logger.info(f"EVENT: {event.to_dict()}")

        if isinstance(exc_val, Exception):
            logger.error(f"EVENT ({exc_type}): {exc_val}")

        if not current_app.db_session.is_active:
            logger.error("Session is not active. It has likely been rolled back.")

        if hasattr(request, "message_bus"):
            logger.info(f"Publishing event {self.event_type.name}")
            request.message_bus.publish(self.event_type.name, event)


def generate_events_update(old_serialized_obj, new_serialized_obj, owner_id, updated_by_id):
    deep_diff = DeepDiff(old_serialized_obj, new_serialized_obj)

    dict_of_changes = {}
    if "values_changed" in deep_diff:
        values_changed = deep_diff["values_changed"]
        # Convert from deepdiff format of "root['value_changed']" to just 'value_changed' as the key in the object
        for key in values_changed.keys():
            if len(parse_path(key)) == 1:
                dict_of_changes[parse_path(key)[0]] = values_changed[key]

    updates = {}
    updates["owner_id"] = owner_id
    updates["updated_by"] = updated_by_id
    updates["changes"] = dict_of_changes
    return updates


def generate_agreement_events_update(old_serialized_obj, new_serialized_obj, owner_id, updated_by_id):
    """Generates updates for agreement events, including all non-list properties as well as team members and budget line items"""
    updates = generate_events_update(old_serialized_obj, new_serialized_obj, owner_id, updated_by_id)
    # Use sets to find differences in team members
    old_team_members = set(old_serialized_obj.get("team_members", []))
    new_team_members = set(new_serialized_obj.get("team_members", []))
    removed_old_members = list(old_team_members - new_team_members)
    added_new_members = list(new_team_members - old_team_members)
    # Use sets to find different in budget line items
    old_bli_list = set(old_serialized_obj.get("budget_line_items", []))
    new_bli_list = set(new_serialized_obj.get("budget_line_items", []))
    removed_bli_items = list(old_bli_list - new_bli_list)
    added_bli_items = list(new_bli_list - old_bli_list)
    # Check for items removed/added in lists
    if removed_bli_items or added_bli_items:
        updates["budget_line_item_changes"] = {
            "bli_ids_removed": removed_bli_items,
            "bli_ids_added": added_bli_items,
        }

    if removed_old_members or added_new_members:
        updates["team_member_changes"] = {
            "user_ids_removed": removed_old_members,
            "user_ids_added": added_new_members,
        }
    return updates
