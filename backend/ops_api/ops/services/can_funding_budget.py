from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import CANFundingBudget


class CANFundingBudgetService:
    def _update_fields(self, old_funding_budget: CANFundingBudget, budget_update) -> bool:
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

    def create(self, create_funding_budget_request) -> CANFundingBudget:
        """
        Create a new CAN Funding Budget and save it to the database
        """
        if "budget" not in create_funding_budget_request:
            raise ValueError("'budget' is a required field")

        new_can = CANFundingBudget(**create_funding_budget_request)

        current_app.db_session.add(new_can)
        current_app.db_session.commit()
        return new_can

    def update(self, updated_fields, id: int) -> CANFundingBudget:
        """
        Update a CANFundingBudget with only the provided values in updated_fields.
        """
        try:
            old_budget: CANFundingBudget = current_app.db_session.execute(
                select(CANFundingBudget).where(CANFundingBudget.id == id)
            ).scalar_one()

            budget_was_updated = self._update_fields(old_budget, updated_fields)
            if budget_was_updated:
                current_app.db_session.add(old_budget)
                current_app.db_session.commit()

            return old_budget
        except NoResultFound:
            current_app.logger.exception(f"Could not find a CANFundingBudget with id {id}")
            raise NotFound()

    def delete(self, id: int):
        """
        Delete a CANFundingBudget with given id. Throw a NotFound error if no CAN corresponding to that ID exists."""
        try:
            old_budget: CANFundingBudget = current_app.db_session.execute(
                select(CANFundingBudget).where(CANFundingBudget.id == id)
            ).scalar_one()
            current_app.db_session.delete(old_budget)
            current_app.db_session.commit()
        except NoResultFound:
            current_app.logger.exception(f"Could not find a CANFundingBudget with id {id}")
            raise NotFound()

    def get(self, id: int) -> CANFundingBudget:
        """
        Get an individual CAN Funding Budget by id.
        """
        stmt = select(CANFundingBudget).where(CANFundingBudget.id == id).order_by(CANFundingBudget.id)
        funding_budget = current_app.db_session.scalar(stmt)

        if funding_budget:
            return funding_budget
        else:
            current_app.logger.exception(f"Could not find a CAN Funding Budget with id {id}")
            raise NotFound()

    def get_list(self) -> list[CANFundingBudget]:
        """
        Get a list of CAN funding budgets, optionally filtered by a search parameter.
        """
        stmt = select(CANFundingBudget).order_by(CANFundingBudget.id)
        results = current_app.db_session.execute(stmt).all()
        return [can for result in results for can in result]
