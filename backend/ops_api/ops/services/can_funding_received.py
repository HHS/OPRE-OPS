from flask import current_app
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import CANFundingReceived


class CANFundingReceivedService:
    def _update_fields(self, old_funding_received: CANFundingReceived, funding_update) -> bool:
        """
        Update fields on the CAN based on the fields passed in can_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in funding_update.items():
            if getattr(old_funding_received, attr) != value:
                setattr(old_funding_received, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_funding_received_request) -> CANFundingReceived:
        """
        Create a new CANFundingReceived object and save it to the database
        """
        new_can = CANFundingReceived(**create_funding_received_request)

        current_app.db_session.add(new_can)
        current_app.db_session.commit()
        return new_can

    def update(self, updated_fields, id: int) -> CANFundingReceived:
        """
        Update a CANFundingReceived object with only the provided values in updated_fields.
        """
        try:
            old_funding_received: CANFundingReceived = current_app.db_session.execute(
                select(CANFundingReceived).where(CANFundingReceived.id == id)
            ).scalar_one()

            funding_received_was_updated = self._update_fields(old_funding_received, updated_fields)
            if funding_received_was_updated:
                current_app.db_session.add(old_funding_received)
                current_app.db_session.commit()

            return old_funding_received
        except NoResultFound as e:
            logger.exception(f"Could not find a CANFundingReceived with id {id}")
            raise NotFound() from e

    def delete(self, id: int) -> CANFundingReceived:
        """
        Delete a CANFundingReceived with given id. Throw a NotFound error if no CAN corresponding to that ID exists.
        """
        try:
            old_funding = current_app.db_session.get(CANFundingReceived, id)

            if old_funding is None:
                raise NotFound(f"No CANFundingReceived found with id {id}")

            current_app.db_session.delete(old_funding)
            current_app.db_session.commit()

            return old_funding

        except NotFound as e:
            logger.exception(f"Could not find a CANFundingReceived with id {id}")
            raise e from e

    def get(self, id: int) -> CANFundingReceived:
        """
        Get an individual CANFundingReceived object by id.
        """
        stmt = select(CANFundingReceived).where(CANFundingReceived.id == id)
        can_funding_received = current_app.db_session.scalar(stmt)

        if can_funding_received:
            return can_funding_received
        else:
            logger.exception(f"Could not find a CANFundingReceived with id {id}")
            raise NotFound()

    def get_list(self) -> list[CANFundingReceived]:
        """
        Get a list of CANFundingReceived objects.
        """
        stmt = select(CANFundingReceived).order_by(CANFundingReceived.id)
        return current_app.db_session.scalars(stmt).all()
