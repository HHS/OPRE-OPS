from typing import Any

from flask import current_app
from flask_jwt_extended import current_user, get_current_user
from sqlalchemy import inspect

from models import (
    CAN,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    Division,
    Portfolio,
    ProcurementTrackerStatus,
    ProcurementTrackerStepType,
)
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
from ops_api.ops.utils.users import is_super_user


def get_division_for_budget_line_item(bli_id: int):
    division = (
        current_app.db_session.query(Division)
        .join(Portfolio, Division.id == Portfolio.division_id)
        .join(CAN, Portfolio.id == CAN.portfolio_id)
        .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
        .filter(BudgetLineItem.id == bli_id)
        .one_or_none()
    )
    return division


def convert_BLI_status_name_to_pretty_string(status_name):
    if status_name == "DRAFT":
        return BudgetLineItemStatus.DRAFT.__str__()
    elif status_name == "PLANNED":
        return BudgetLineItemStatus.PLANNED.__str__()
    elif status_name == "IN_EXECUTION":
        return BudgetLineItemStatus.IN_EXECUTION.__str__()
    elif status_name == "OBLIGATED":
        return BudgetLineItemStatus.OBLIGATED.__str__()
    elif status_name == "PLANNED_MOD":
        return BudgetLineItemStatus.PLANNED_MOD.__str__()
    else:
        return BudgetLineItemStatus.DRAFT.__str__()


def update_data(budget_line_item: BudgetLineItem, data: dict[str, Any]) -> None:
    for item in data:
        if item in [c_attr.key for c_attr in inspect(budget_line_item).mapper.column_attrs]:
            setattr(budget_line_item, item, data[item])


def create_budget_line_item_instance(agreement_type: AgreementType, data: dict[str, Any]) -> BudgetLineItem:
    """
    Create a specific BudgetLineItem instance based on the agreement type using the factory pattern.

    Args:
        agreement_type: The type of agreement
        data: Dictionary containing the data for the budget line item

    Returns:
        A BudgetLineItem instance of the appropriate subclass

    Raises:
        ValueError: If the agreement type is not supported
    """
    # Automatically build factories by inspecting subclasses of BudgetLineItem
    budget_line_item_factories = {}
    for subclass in BudgetLineItem.__subclasses__():
        # Get the polymorphic identity from the __mapper_args__ if it exists
        if hasattr(subclass, "__mapper_args__") and "polymorphic_identity" in subclass.__mapper_args__:
            identity = subclass.__mapper_args__["polymorphic_identity"]
            if isinstance(identity, AgreementType):
                budget_line_item_factories[identity] = subclass

    factory = budget_line_item_factories.get(agreement_type)
    if not factory:
        raise ValueError(f"Unsupported agreement type: {agreement_type}")

    return factory(**data)


EDITABLE_STATUSES = [
    BudgetLineItemStatus.DRAFT,
    BudgetLineItemStatus.PLANNED,
    BudgetLineItemStatus.IN_EXECUTION,
]


def is_agreement_in_pre_award_or_later(agreement) -> bool:
    """True if the agreement has an ACTIVE procurement tracker at step >= 5 (PRE_AWARD/AWARD)."""
    if not agreement or not agreement.procurement_trackers:
        return False
    tracker = next((t for t in agreement.procurement_trackers if t.status == ProcurementTrackerStatus.ACTIVE), None)
    return bool(tracker and tracker.active_step_number and tracker.active_step_number >= 5)


def compute_bli_editable(budget_line_item, in_review: bool, is_super: bool) -> bool:
    """Single source of truth for BLI editability rules (no DB queries).

    Both ``is_bli_editable`` (single-item, DB-backed) and the list-meta builder
    (pre-computed values) delegate here so the rules cannot drift apart.
    """
    if budget_line_item is None:
        return False

    editable = is_super or budget_line_item.status in EDITABLE_STATUSES

    # if the BLI is in review or is OBE, it cannot be edited
    if in_review:
        editable = False

    if not is_super and budget_line_item.is_obe:
        editable = False

    # editing is blocked once the agreement reaches Pre-Award (step 5) or Award (step 6)
    if not is_super and is_agreement_in_pre_award_or_later(budget_line_item.agreement):
        editable = False

    return editable


def get_bli_locked_message(budget_line_item, in_review: bool, is_super: bool) -> str | None:
    """Human-readable reason a BLI is locked that the frontend cannot derive on its own.

    Currently only the procurement-step block, since the BLI payload carries no tracker-step
    data. Returns None when that block does not apply.
    """
    if budget_line_item is None or is_super:
        return None
    if not in_review and is_agreement_in_pre_award_or_later(budget_line_item.agreement):
        return "This budget line can't be edited because the agreement has reached Pre-Award."
    return None


def compute_bli_is_deletable(budget_line_item, in_review: bool, is_super: bool) -> bool:
    """Single source of truth for whether the delete control should be enabled.

    A BLI is deletable whenever it is editable (DRAFT/PLANNED/IN_EXECUTION, not in review, not
    OBE, agreement not at Pre-Award/Award), or the user is a super user. DRAFT deletes
    immediately; PLANNED/IN_EXECUTION deletions route through an approval change request (handled
    in the service). The delete control is therefore enabled in exactly the same cases as edit.
    """
    if budget_line_item is None:
        return False
    return compute_bli_editable(budget_line_item, in_review, is_super)


def is_bli_editable(budget_line_item):
    """A utility function that determines if a BLI is editable"""
    return compute_bli_editable(
        budget_line_item,
        in_review=budget_line_item.in_review,
        is_super=is_super_user(current_user, current_app),
    )


def is_pre_award_in_review(agreement):
    """
    Check if the agreement's pre-award approval is currently in review.

    Returns True if pre-award approval has been requested and is awaiting decision.
    Uses defensive logic: explicitly checks for terminal states (fully approved or declined),
    and treats all other cases as "in review" when approval has been requested.

    Args:
        agreement: Agreement object to check

    Returns:
        bool: True if pre-award is in review, False otherwise
    """
    if not agreement or not agreement.procurement_trackers:
        return False

    # Get the active procurement tracker
    tracker = next((t for t in agreement.procurement_trackers if t.status == ProcurementTrackerStatus.ACTIVE), None)
    if not tracker:
        return False

    pre_award_step = next(
        (step for step in tracker.steps if step.step_type == ProcurementTrackerStepType.PRE_AWARD), None
    )

    if not pre_award_step or not pre_award_step.pre_award_approval_requested:
        return False

    # Explicitly check for terminal states (approval process complete)
    if (
        pre_award_step.pre_award_approval_status == "APPROVED"
        and pre_award_step.pre_award_requisition_approved_by is not None
    ):
        return False  # Fully approved - not in review

    if pre_award_step.pre_award_approval_status == "DECLINED":
        return False  # Declined - not in review

    # All other cases when approval is requested: in review
    # This includes None, "PENDING", "APPROVED" without requisition, and any unexpected values
    return True


def bli_associated_with_agreement(id: int) -> bool:
    """
    In order to edit a budget line or agreement, the budget line must be associated with an Agreement, and the
    user must be authenticated and meet on of these conditions:
        -  The user is the agreement creator.
        -  The user is the project officer of the agreement.
        -  The user is a team member on the agreement.
        -  The user is a budget team member.

    :param id: The id of the budget line item
    """
    user = get_current_user()

    budget_line_item = current_app.db_session.get(BudgetLineItem, id)

    if not user.id or not budget_line_item:
        raise ResourceNotFoundError("BudgetLineItem", id)

    if not budget_line_item.agreement:
        raise AuthorizationError(
            f"BudgetLineItem {id} does not have an associated agreement. Cannot check association.",
            "BudgetLineItem",
        )

    return associated_with_agreement(budget_line_item.agreement.id)
