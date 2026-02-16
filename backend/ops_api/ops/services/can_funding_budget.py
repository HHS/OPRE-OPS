from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models import CAN, CANFundingBudget
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError


class CANFundingBudgetService:

    def __init__(self, session: Session):
        self.session = session

    def create(self, create_funding_budget_request: dict[str, Any]) -> CANFundingBudget:
        """
        Create a new CAN Funding Budget and save it to the database
        """
        can_id = create_funding_budget_request.get("can_id")
        can = self.session.get(CAN, can_id)

        if not can:
            raise ResourceNotFoundError("CAN", can_id)

        if can.is_expired:
            raise ValidationError({"can_id": ["Cannot add budget to an expired CAN."]})

        new_can = CANFundingBudget(**create_funding_budget_request)

        self.session.add(new_can)
        self.session.commit()
        return new_can

    def update(self, updated_fields: dict[str, Any], obj_id: int) -> CANFundingBudget:
        """
        Update a CANFundingBudget with only the provided values in updated_fields.
        """
        old_budget = self.session.get(CANFundingBudget, obj_id)

        if not old_budget:
            raise ResourceNotFoundError("CANFundingBudget", obj_id)

        budget_was_updated = _update_fields(old_budget, updated_fields)
        if budget_was_updated:
            self.session.add(old_budget)
            self.session.commit()

        return old_budget

    def delete(self, obj_id: int):
        """
        Delete a CANFundingBudget with given id. Throw a NotFound error if no CAN corresponding to that ID exists.
        """
        old_budget = self.session.get(CANFundingBudget, obj_id)

        if not old_budget:
            raise ResourceNotFoundError("CANFundingBudget", obj_id)

        self.session.delete(old_budget)
        self.session.commit()

    def get(self, obj_id: int) -> CANFundingBudget:
        """
        Get an individual CAN Funding Budget by id.
        """
        funding_budget = self.session.get(
            CANFundingBudget,
            obj_id,
            options=[
                selectinload(CANFundingBudget.can).selectinload(CAN.funding_details),
                selectinload(CANFundingBudget.can).selectinload(CAN.budget_line_items),
                selectinload(CANFundingBudget.can).selectinload(CAN.funding_budgets),
                selectinload(CANFundingBudget.can).selectinload(CAN.portfolio),
            ],
        )

        if not funding_budget:
            raise ResourceNotFoundError("CANFundingBudget", obj_id)

        return funding_budget

    def get_list(self) -> list[CANFundingBudget]:
        """
        Get a list of CAN funding budgets, optionally filtered by a search parameter.
        """
        stmt = select(CANFundingBudget).order_by(CANFundingBudget.id)
        return self.session.scalars(stmt).all()


def _update_fields(old_funding_budget: CANFundingBudget, budget_update: dict[str, Any]) -> bool:
    """
    Update fields on the CAN based on the fields passed in can_update.
    Returns true if any fields were updated.
    """
    is_changed = False
    for attr, value in budget_update.items():
        if getattr(old_funding_budget, attr) != value:
            setattr(old_funding_budget, attr, value)
            is_changed = True

    return is_changed
