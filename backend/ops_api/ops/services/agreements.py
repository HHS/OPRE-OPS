from typing import Any

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Agreement, BudgetLineItemStatus, User, Vendor
from ops_api.ops.services.ops_service import AuthorizationError, OpsService, ResourceNotFoundError, ValidationError


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

        updated_fields["id"] = id

        _set_team_members(self.db_session, updated_fields)

        agreement_data = agreement_cls(**updated_fields)

        add_update_vendor(self.db_session, updated_fields.get("vendor"), agreement_data, "vendor")

        self.db_session.merge(agreement_data)
        self.db_session.commit()

        return agreement, 200

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
    if any(bli.status == BudgetLineItemStatus.IN_EXECUTION for bli in agreement.budget_line_items):
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
