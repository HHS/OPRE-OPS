from typing import Any

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import select

from models.change_requests import ChangeRequest
from ops_api.ops.services.change_requests import ChangeRequestService
from models import (
    Agreement,
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ContractType,
    ServiceRequirementType,
    User,
    Vendor,
)
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError, ValidationError


class AgreementsService(OpsService[Agreement]):
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> Agreement:
        """
        Create a new agreement
        """
        agreement = Agreement()
        # Map fields from create_request to agreement object
        for key, value in create_request.items():
            if hasattr(agreement, key):
                setattr(agreement, key, value)

        # Set created_by to current user
        user = get_current_user()
        agreement.created_by = user.id

        current_app.db_session.add(agreement)
        current_app.db_session.commit()

        return agreement

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[Agreement, int]:
        """
        Update an existing agreement
        """
        agreement = self.db_session.get(Agreement, id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", id)

        # Check if user is associated with this agreement
        if not associated_with_agreement(id):
            from ops_api.ops.services.ops_service import AuthorizationError

            raise AuthorizationError(f"User is not associated with the agreement for id: {id}.", "Agreement")

        bli_statuses = list(BudgetLineItemStatus.__members__.values())
        change_request_id = None

        # Update fields
        for key, value in updated_fields.items():
            if hasattr(agreement, key):
                match (key):
                    case "team_members":
                        tmp_team_members = _get_user_list(value)
                        agreement.team_members = tmp_team_members if tmp_team_members else []

                    case "support_contacts":
                        tmp_support_contacts = _get_user_list(value)
                        agreement.support_contacts = tmp_support_contacts if tmp_support_contacts else []

                    case "awarding_entity_id":
                        if agreement.awarding_entity_id != value:
                            # Check if any budget line items are in execution or higher (by enum definition)
                            if any(
                                [
                                    bli_statuses.index(bli.status)
                                    >= bli_statuses.index(BudgetLineItemStatus.IN_EXECUTION)
                                    for bli in agreement.budget_line_items
                                ]
                            ):
                                raise ValidationError(
                                    "Cannot change Procurement Shop for an Agreement if any Budget "
                                    "Lines are in Execution or higher."
                                )

                            # Check if any budget line items are PLANNED
                            if any(
                                [
                                    bli_statuses.index(bli.status) == bli_statuses.index(BudgetLineItemStatus.PLANNED)
                                    for bli in agreement.budget_line_items
                                ]
                            ):
                                change_request_service: OpsService[ChangeRequest] = ChangeRequestService(
                                    current_app.db_session
                                )
                                change_request_id = change_request_service.add_agreement_change_requests(
                                    agreement, value
                                )

                            setattr(agreement, key, value)

                            for bli in agreement.budget_line_items:
                                if bli_statuses.index(bli.status) <= bli_statuses.index(BudgetLineItemStatus.PLANNED):
                                    bli.procurement_shop_fee = (
                                        # TODO: is it correct to set the first item as bli procurement_shop_fee?
                                        agreement.procurement_shop.procurement_shop_fees[0]
                                        if agreement.procurement_shop
                                        and agreement.procurement_shop.procurement_shop_fees
                                        else None
                                    )

                    case "agreement_reason":
                        if isinstance(value, str):
                            setattr(agreement, key, AgreementReason[value])

                    case "agreement_type":
                        if isinstance(value, str):
                            setattr(agreement, key, AgreementType[value])

                    case "contract_type":
                        if isinstance(value, str):
                            setattr(agreement, key, ContractType[value])

                    case "service_requirement_type":
                        if isinstance(value, str):
                            setattr(agreement, key, ServiceRequirementType[value])
                    case "vendor":
                        if isinstance(value, str):
                            add_update_vendor(value, agreement, "vendor")
                    case _:
                        if getattr(agreement, key) != value:
                            setattr(agreement, key, value)

        self.db_session.add(agreement)
        self.db_session.commit()

        return agreement, 202 if change_request_id else 200

    def delete(self, id: int) -> None:
        """
        Delete an agreement
        """
        agreement = current_app.db_session.get(Agreement, id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", id)

        # Check if user is associated with this agreement

        if not associated_with_agreement(id):
            from ops_api.ops.services.ops_service import AuthorizationError

            raise AuthorizationError(
                f"User is not associated with the agreement for id: {id}.",
                "Agreement",
            )

        current_app.db_session.delete(agreement)
        current_app.db_session.commit()

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
        query = current_app.db_session.query(Agreement)

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


def associated_with_agreement(id: int) -> bool:
    """
    In order to edit a budget line or agreement, the budget line must be associated with an Agreement, and the
    user must be authenticated and meet on of these conditions:
        -  The user is the agreement creator.
        -  The user is the project officer of the agreement.
        -  The user is a team member on the agreement.
        -  The user is a budget team member.

    :param id: The id of the agreement
    """
    user = get_current_user()

    agreement = current_app.db_session.get(Agreement, id)

    if not user.id or not agreement:
        raise ResourceNotFoundError("BudgetLineItem", id)

    return check_user_association(agreement, user)


def check_user_association(agreement: Agreement, user: User) -> bool:
    """
    Check if the user is associated with, and so should be able to modify, the agreement.
    """
    if agreement:
        agreement_cans = [bli.can for bli in agreement.budget_line_items if bli.can]
        agreement_divisions = [can.portfolio.division for can in agreement_cans]
        agreement_division_directors = [
            division.division_director_id for division in agreement_divisions if division.division_director_id
        ]
        agreement_deputy_division_directors = [
            division.deputy_division_director_id
            for division in agreement_divisions
            if division.deputy_division_director_id
        ]
        agreement_portfolios = [can.portfolio for can in agreement_cans]
        agreement_portfolio_team_leaders = [
            user.id for portfolio in agreement_portfolios for user in portfolio.team_leaders
        ]
        if user.id in {
            agreement.created_by,
            agreement.project_officer_id,
            agreement.alternate_project_officer_id,
            *(dd for dd in agreement_division_directors),
            *(dd for dd in agreement_deputy_division_directors),
            *(ptl for ptl in agreement_portfolio_team_leaders),
            *(tm.id for tm in agreement.team_members),
        }:
            return True
    if "BUDGET_TEAM" in (role.name for role in user.roles):
        return True

    if "SYSTEM_OWNER" in (role.name for role in user.roles):
        return True

    return False


def _get_user_list(data: Any) -> list[User] | None:
    tmp_ids = []
    if data:
        for item in data:
            try:
                tmp_ids.append(item.id)
            except AttributeError:
                tmp_ids.append(item["id"])
    return [current_app.db_session.get(User, tm_id) for tm_id in tmp_ids] if tmp_ids else None


def add_update_vendor(vendor: str, agreement: Agreement, field_name: str = "vendor") -> None:
    if vendor:
        vendor_obj = current_app.db_session.scalar(select(Vendor).where(Vendor.name.ilike(vendor)))
        if not vendor_obj:
            new_vendor = Vendor(name=vendor)
            current_app.db_session.add(new_vendor)
            current_app.db_session.commit()
            setattr(agreement, f"{field_name}_id", new_vendor.id)
        else:
            setattr(agreement, f"{field_name}_id", vendor_obj.id)
