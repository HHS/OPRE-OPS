from typing import Any

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from models import Agreement, User
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.utils.users import is_super_user

# Name of the unique index that enforces case-insensitive (name, agreement_type) uniqueness.
# Defined in models/agreements.py and migration 2025_12_09_1950-d8f34037b656.
AGREEMENT_NAME_UNIQUE_INDEX = "ix_agreement_name_type_lower"

# Name of the unique constraint on CLIN (number, agreement_id).
# Defined in models/services_components.py. PostgreSQL auto-generates this name from
# the table and column names since no explicit name= was given to UniqueConstraint.
CLIN_NUMBER_AGREEMENT_UNIQUE_CONSTRAINT = "clin_number_agreement_id_key"


def is_unique_violation(error: IntegrityError, constraint_name: str) -> bool:
    """Return True if ``error`` was raised by the named unique constraint.

    Prefer the structured ``constraint_name`` from the underlying psycopg diagnostics when it
    is a real string. Only fall back to a substring check on the error message when the driver
    doesn't expose diag (e.g. SQLite in unit tests, wrapped errors, or mocks). When a real
    string diag IS available, it is authoritative — a diag mismatch means a different constraint.
    """
    diag = getattr(getattr(error, "orig", None), "diag", None)
    actual_constraint = getattr(diag, "constraint_name", None) if diag is not None else None
    if isinstance(actual_constraint, str):
        # Diag is available and is a real string — trust it exclusively
        return actual_constraint == constraint_name
    # Diag unavailable or not a string (e.g. SQLite, wrapped error, mock) — fall back to substring check
    return constraint_name in str(error)


def is_agreement_name_unique_violation(error: IntegrityError) -> bool:
    """Return True if ``error`` was raised by the agreement (name, agreement_type) unique index.

    Prefer the structured ``constraint_name`` from the underlying psycopg diagnostics; fall back
    to a substring check on the error message when the driver doesn't expose diag (e.g. SQLite
    in unit tests, or wrapped errors).
    """
    return is_unique_violation(error, AGREEMENT_NAME_UNIQUE_INDEX)


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

    if is_super_user(user, current_app):
        return True

    return False


def get_division_directors_for_agreement(
    agreement: Agreement,
) -> tuple[list[int], list[int]]:
    """
    Returns a tuple containing:
    - List of division director IDs
    - List of deputy division director IDs
    associated with the agreement.

    Uses all BLIs (regardless of status) so that permission checks and
    general director resolution work even when BLIs are still in DRAFT.
    For pre-award notification routing (which should only consider the BLIs
    being approved), use get_pre_award_notification_directors_for_agreement.
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


def get_pre_award_notification_directors_for_agreement(
    agreement: Agreement,
) -> tuple[list[int], list[int]]:
    """
    Returns division director IDs for pre-award approval notifications.

    Only considers PLANNED and IN_EXECUTION BLIs — those are the BLIs being
    submitted for pre-award approval. The COR is assumed to have assigned the
    correct CAN (and therefore the correct division) to them before submitting.
    """
    from models.budget_line_items import BudgetLineItemStatus

    validatable_statuses = {BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.IN_EXECUTION}
    agreement_cans = [bli.can for bli in agreement.budget_line_items if bli.can and bli.status in validatable_statuses]
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
