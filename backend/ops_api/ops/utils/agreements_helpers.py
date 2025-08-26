from typing import Any

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import inspect

from models import Agreement, User
from ops_api.ops.services.ops_service import ResourceNotFoundError


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
        agreement_division_directors, agreement_deputy_division_directors = get_division_directors_for_agreement(
            agreement
        )

        agreement_cans = [bli.can for bli in agreement.budget_line_items if bli.can]
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

    if current_app.config.get("SUPER_USER", "SUPER_USER") in (role.name for role in user.roles):
        return True

    return False


def get_division_directors_for_agreement(agreement: Agreement) -> tuple[list[int], list[int]]:
    """
    Returns a tuple containing:
    - List of division director IDs
    - List of deputy division director IDs
    associated with the agreement.
    """
    agreement_cans = [bli.can for bli in agreement.budget_line_items if bli.can]
    agreement_divisions = {can.portfolio.division for can in agreement_cans if can.portfolio and can.portfolio.division}

    division_directors = [
        division.division_director_id for division in agreement_divisions if division.division_director_id
    ]
    deputy_division_directors = [
        division.deputy_division_director_id for division in agreement_divisions if division.deputy_division_director_id
    ]
    return division_directors, deputy_division_directors


def update_agreement(agreement: Agreement, data: dict[str, Any]) -> None:
    """
    Update Agreement instance with values from data dict
    if the keys correspond to actual column attributes on the model.
    """
    for item in data:
        if item in [c_attr.key for c_attr in inspect(agreement).mapper.column_attrs]:
            setattr(agreement, item, data[item])
