from typing import Any

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Agreement, BudgetLineItemStatus, ChangeRequestType, OpsEventType, User, Vendor
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import AuthorizationError, OpsService, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
from ops_api.ops.utils.events import OpsEventHandler


class AgreementsService(OpsService[Agreement]):
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> Agreement:
        """
        Create a new agreement
        """
        agreement_cls = create_request.get("agreement_cls")
        del create_request["agreement_cls"]

        _set_team_members(self.db_session, create_request)

        agreement = agreement_cls(**create_request)

        add_update_vendor(self.db_session, create_request.get("vendor"), agreement, "vendor")

        self.db_session.add(agreement)
        self.db_session.commit()

        return agreement

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[Agreement, int]:
        """
        Update an existing agreement
        """
        agreement = self.db_session.get(Agreement, id)

        _validate_update_request(agreement, id, updated_fields)

        agreement_cls = updated_fields.get("agreement_cls")
        del updated_fields["agreement_cls"]

        # unpack the awarding_entity_id if it exists since we handle it separately (after the merge)
        awarding_entity_id = None
        if "awarding_entity_id" in updated_fields:
            awarding_entity_id = updated_fields.get("awarding_entity_id")
            del updated_fields["awarding_entity_id"]

        updated_fields["id"] = id

        _set_team_members(self.db_session, updated_fields)

        agreement_data = agreement_cls(**updated_fields)

        add_update_vendor(self.db_session, updated_fields.get("vendor"), agreement_data, "vendor")

        self.db_session.merge(agreement_data)
        self.db_session.commit()

        change_request_id = None
        if awarding_entity_id:
            change_request_id = self._handle_proc_shop_change(agreement, awarding_entity_id)
            if change_request_id:
                self.db_session.commit()

        return agreement, 202 if change_request_id else 200

    def delete(self, id: int) -> None:
        """
        Delete an agreement
        """
        agreement = self.db_session.get(Agreement, id)

        if not agreement:
            raise ResourceNotFoundError("Agreement", id)

        if not associated_with_agreement(id):
            raise AuthorizationError(
                f"User is not associated with the agreement for id: {id}.",
                "Agreement",
            )

        self.db_session.delete(agreement)
        self.db_session.commit()

    def get(self, id: int) -> Agreement:
        """
        Get an agreement by ID
        """
        agreement = self.db_session.get(Agreement, id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", id)
        return agreement

    def get_list(self, data: dict | None) -> tuple[list[Agreement], dict | None]:
        """
        Get list of agreements with optional filtering
        """
        query = self.db_session.query(Agreement)

        # Apply filters if provided
        if data:
            if "status" in data:
                query = query.filter(Agreement.status == data["status"])
            if "project_officer_id" in data:
                query = query.filter(Agreement.project_officer_id == data["project_officer_id"])
            # Add more filters as needed

        # Apply pagination if provided
        page = data.get("page", 1) if data else 1
        per_page = data.get("per_page", 10) if data else 10

        # Execute query with pagination
        agreements = query.limit(per_page).offset((page - 1) * per_page).all()

        # Count total for pagination metadata
        total = query.count()

        pagination = {"total": total, "page": page, "per_page": per_page, "pages": (total + per_page - 1) // per_page}

        return agreements, pagination

    def _handle_proc_shop_change(self, agreement: Agreement, new_value: int) -> int | None:
        if agreement.awarding_entity_id == new_value:
            return None  # No change needed

        # Get the current status list for ordering
        bli_statuses = list(BudgetLineItemStatus.__members__.values())

        # Block if any BLIs are IN_EXECUTION or higher
        if any(
            [
                bli_statuses.index(bli.status) >= bli_statuses.index(BudgetLineItemStatus.IN_EXECUTION)
                for bli in agreement.budget_line_items
            ]
        ):
            raise ValidationError(
                "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
            )

        # Apply the change immediate if all BLIs are DRAFT
        if all(
            bli_statuses.index(bli.status) == bli_statuses.index(BudgetLineItemStatus.DRAFT)
            for bli in agreement.budget_line_items
        ):
            agreement.awarding_entity_id = new_value
            return None

        # Create a change request if at least one BLI is in PLANNED status
        if any(bli.status == BudgetLineItemStatus.PLANNED for bli in agreement.budget_line_items):
            change_request_service = ChangeRequestService(current_app.db_session)
            with OpsEventHandler(OpsEventType.CREATE_CHANGE_REQUEST) as cr_meta:
                change_request = change_request_service.create(
                    {
                        "agreement_id": agreement.id,
                        "requested_change_data": {"awarding_entity_id": new_value},
                        "requested_change_diff": {
                            "awarding_entity_id": {
                                "new": new_value,
                                "old": agreement.awarding_entity_id,
                            }
                        },
                        "created_by": get_current_user().id,
                        "change_request_type": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
                    }
                )
                cr_meta.metadata.update({"New Change Request": change_request.to_dict()})
            return change_request.id

        return None

    def _update_draft_blis_proc_shop_fees(self, agreement: Agreement):
        current_fee = (
            agreement.procurement_shop.current_fee
            if agreement.procurement_shop and agreement.procurement_shop.procurement_shop_fees
            else None
        )
        for bli in agreement.budget_line_items:
            bli.procurement_shop_fee = current_fee


def add_update_vendor(session: Session, vendor: str, agreement: Agreement, field_name: str = "vendor") -> None:
    if vendor:
        vendor_obj = session.scalar(select(Vendor).where(Vendor.name.ilike(vendor)))
        if not vendor_obj:
            new_vendor = Vendor(name=vendor)
            session.add(new_vendor)
            session.commit()
            setattr(agreement, f"{field_name}", new_vendor)
        else:
            setattr(agreement, f"{field_name}", vendor_obj)


def get_team_members_from_request(session: Session, team_members_list: list[dict[str, Any]]) -> list[User]:
    """
    Translate the team_members_list from the request (Marshmallow schema) into a list of User objects.
    """
    if not team_members_list:
        return []
    return [session.get(User, tm_id.get("id")) for tm_id in team_members_list]


def _set_team_members(session: Session, updated_fields: dict[str, Any]) -> None:
    """
    Set team members and support contacts from the request data.
    """
    # TODO: would be nice for marshmallow to handle this instead at load time
    if "team_members" in updated_fields:
        updated_fields["team_members"] = get_team_members_from_request(session, updated_fields.get("team_members", []))
    if "support_contacts" in updated_fields:
        updated_fields["support_contacts"] = get_team_members_from_request(
            session, updated_fields.get("support_contacts", [])
        )


def _validate_update_request(agreement, id, updated_fields):
    """
    Validate the update request for an agreement.
    """
    if not agreement:
        raise ResourceNotFoundError("Agreement", id)
    if not associated_with_agreement(id):
        raise AuthorizationError(f"User is not associated with the agreement for id: {id}.", "Agreement")
    if any(
        bli.status in [BudgetLineItemStatus.IN_EXECUTION, BudgetLineItemStatus.OBLIGATED]
        for bli in agreement.budget_line_items
    ):
        raise ValidationError(
            {"budget_line_items": "Cannot update an Agreement with Budget Lines that are in Execution or higher."}
        )
    if updated_fields.get("agreement_type") and updated_fields.get("agreement_type") != agreement.agreement_type:
        raise ValidationError({"agreement_type": "Cannot change the agreement type of an existing agreement."})
    if "awarding_entity_id" in updated_fields and agreement.awarding_entity_id != updated_fields.get(
        "awarding_entity_id"
    ):
        # Check if any budget line items are in execution or higher (by enum definition)
        if any(
            [
                list(BudgetLineItemStatus.__members__.values()).index(bli.status)
                >= list(BudgetLineItemStatus.__members__.values()).index(BudgetLineItemStatus.IN_EXECUTION)
                for bli in agreement.budget_line_items
            ]
        ):
            raise ValidationError(
                {
                    "awarding_entity_id": "Cannot change Procurement Shop for an Agreement if any Budget "
                    "Lines are in Execution or higher."
                }
            )
