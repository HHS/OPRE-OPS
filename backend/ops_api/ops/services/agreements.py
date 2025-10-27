from dataclasses import dataclass
from typing import Any, Optional, Type

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    Agreement,
    AgreementSortCondition,
    BudgetLineItemStatus,
    ChangeRequestType,
    OpsEventType,
    User,
    Vendor,
)
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    OpsService,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
from ops_api.ops.utils.events import OpsEventHandler


@dataclass
class AgreementFilters:
    """Data class to encapsulate all filter parameters for Agreements."""

    fiscal_year: Optional[list[int]] = None
    budget_line_status: Optional[list[str]] = None
    portfolio: Optional[list[int]] = None
    project_id: Optional[list[int]] = None
    agreement_reason: Optional[list[str]] = None
    contract_number: Optional[list[str]] = None
    contract_type: Optional[list[str]] = None
    agreement_type: Optional[list[str]] = None
    delivered_status: Optional[list[str]] = None
    awarding_entity_id: Optional[list[int]] = None
    project_officer_id: Optional[list[int]] = None
    alternate_project_officer_id: Optional[list[int]] = None
    foa: Optional[list[str]] = None
    name: Optional[list[str]] = None
    search: Optional[list[str]] = None
    only_my: Optional[list[bool]] = None
    limit: Optional[list[int]] = None
    offset: Optional[list[int]] = None
    sort_conditions: Optional[list[AgreementSortCondition]] = None
    sort_descending: Optional[list[bool]] = None

    @classmethod
    def parse_filters(cls, data: dict) -> "AgreementFilters":
        """Parse filter parameters from request data."""
        return cls(
            fiscal_year=data.get("fiscal_year", []),
            budget_line_status=data.get("budget_line_status", []),
            portfolio=data.get("portfolio", []),
            project_id=data.get("project_id", []),
            agreement_reason=data.get("agreement_reason", []),
            contract_number=data.get("contract_number", []),
            contract_type=data.get("contract_type", []),
            agreement_type=data.get("agreement_type", []),
            delivered_status=data.get("delivered_status", []),
            awarding_entity_id=data.get("awarding_entity_id", []),
            project_officer_id=data.get("project_officer_id", []),
            alternate_project_officer_id=data.get("alternate_project_officer_id", []),
            foa=data.get("foa", []),
            name=data.get("name", []),
            search=data.get("search", []),
            only_my=data.get("only_my", []),
            limit=data.get("limit", [10]),
            offset=data.get("offset", [0]),
            sort_conditions=data.get("sort_conditions", []),
            sort_descending=data.get("sort_descending", []),
        )


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

        add_update_vendor(
            self.db_session, create_request.get("vendor"), agreement, "vendor"
        )

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

        add_update_vendor(
            self.db_session, updated_fields.get("vendor"), agreement_data, "vendor"
        )

        self.db_session.merge(agreement_data)
        self.db_session.commit()

        change_request_id = None
        if awarding_entity_id:
            change_request_id = self._handle_proc_shop_change(
                agreement, awarding_entity_id
            )

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

    def get_list(
        self, agreement_classes: list[Type[Agreement]], data: dict[str, Any]
    ) -> tuple[list[Agreement], dict[str, Any]]:
        """
        Get list of agreements with optional filtering and pagination.

        Args:
            agreement_classes: List of Agreement subclasses to query (e.g., ContractAgreement, GrantAgreement)
            data: Dictionary containing filter parameters including limit and offset

        Returns:
            Tuple of (paginated agreements list, metadata dict with count/limit/offset)
        """
        # Import helper functions from resources
        from ops_api.ops.resources.agreements import (
            _get_agreements,
            _sort_agreements,
        )

        filters = AgreementFilters.parse_filters(data)

        # Collect all agreements across types using existing resource helpers
        all_results = []
        for agreement_cls in agreement_classes:
            agreements = _get_agreements(self.db_session, agreement_cls, data)
            all_results.extend(agreements)

        # Sort combined results
        if filters.sort_conditions and len(filters.sort_conditions) > 0:
            sort_condition = filters.sort_conditions[0]
            sort_descending = (
                filters.sort_descending[0]
                if filters.sort_descending and len(filters.sort_descending) > 0
                else False
            )
            all_results = _sort_agreements(all_results, sort_condition, sort_descending)

        # Calculate count before slicing
        total_count = len(all_results)

        # Apply pagination slicing
        if filters.limit and filters.offset:
            limit_value = filters.limit[0]
            offset_value = filters.offset[0]
            paginated_results = all_results[offset_value : offset_value + limit_value]
        else:
            paginated_results = all_results
            limit_value = total_count
            offset_value = 0

        metadata = {
            "count": total_count,
            "limit": limit_value,
            "offset": offset_value,
        }

        return paginated_results, metadata

    def _handle_proc_shop_change(
        self, agreement: Agreement, new_value: int
    ) -> int | None:
        if agreement.awarding_entity_id == new_value:
            return None  # No change needed

        # Get the current status list for ordering
        bli_statuses = list(BudgetLineItemStatus.__members__.values())

        # Block if any BLIs are IN_EXECUTION or higher
        if any(
            [
                bli_statuses.index(bli.status)
                >= bli_statuses.index(BudgetLineItemStatus.IN_EXECUTION)
                for bli in agreement.budget_line_items
            ]
        ):
            raise ValidationError(
                "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
            )

        # Apply the change immediate if all BLIs are DRAFT
        if all(
            bli_statuses.index(bli.status)
            == bli_statuses.index(BudgetLineItemStatus.DRAFT)
            for bli in agreement.budget_line_items
        ):
            agreement.awarding_entity_id = new_value
            # TODO: update budget line items' procurement shop fees directly for DRAFT BLIs
            # self._update_draft_blis_proc_shop_fees(agreement)
            return None

        # Create a change request if at least one BLI is in PLANNED status
        if any(
            bli.status == BudgetLineItemStatus.PLANNED
            for bli in agreement.budget_line_items
        ):
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
                cr_meta.metadata.update(
                    {
                        "agreement_id": agreement.id,
                        "change_request": change_request.to_dict(),
                    }
                )
            return change_request.id

        return None

    def _update_draft_blis_proc_shop_fees(self, agreement: Agreement):
        current_fee = (
            agreement.procurement_shop.current_fee
            if agreement.procurement_shop
            and agreement.procurement_shop.procurement_shop_fees
            else None
        )
        for bli in agreement.budget_line_items:
            bli.procurement_shop_fee = current_fee


def add_update_vendor(
    session: Session, vendor: str, agreement: Agreement, field_name: str = "vendor"
) -> None:
    if vendor:
        vendor_obj = session.scalar(select(Vendor).where(Vendor.name.ilike(vendor)))
        if not vendor_obj:
            new_vendor = Vendor(name=vendor)
            session.add(new_vendor)
            session.commit()
            setattr(agreement, f"{field_name}", new_vendor)
        else:
            setattr(agreement, f"{field_name}", vendor_obj)


def get_team_members_from_request(
    session: Session, team_members_list: list[dict[str, Any]]
) -> list[User]:
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
        updated_fields["team_members"] = get_team_members_from_request(
            session, updated_fields.get("team_members", [])
        )
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
        raise AuthorizationError(
            f"User is not associated with the agreement for id: {id}.", "Agreement"
        )
    if any(
        bli.status
        in [BudgetLineItemStatus.IN_EXECUTION, BudgetLineItemStatus.OBLIGATED]
        for bli in agreement.budget_line_items
    ):
        raise ValidationError(
            {
                "budget_line_items": "Cannot update an Agreement with Budget Lines that are in Execution or higher."
            }
        )
    if (
        updated_fields.get("agreement_type")
        and updated_fields.get("agreement_type") != agreement.agreement_type
    ):
        raise ValidationError(
            {
                "agreement_type": "Cannot change the agreement type of an existing agreement."
            }
        )
    if (
        "awarding_entity_id" in updated_fields
        and agreement.awarding_entity_id != updated_fields.get("awarding_entity_id")
    ):
        # Check if any budget line items are in execution or higher (by enum definition)
        if any(
            [
                list(BudgetLineItemStatus.__members__.values()).index(bli.status)
                >= list(BudgetLineItemStatus.__members__.values()).index(
                    BudgetLineItemStatus.IN_EXECUTION
                )
                for bli in agreement.budget_line_items
            ]
        ):
            raise ValidationError(
                {
                    "awarding_entity_id": "Cannot change Procurement Shop for an Agreement if any Budget "
                    "Lines are in Execution or higher."
                }
            )
