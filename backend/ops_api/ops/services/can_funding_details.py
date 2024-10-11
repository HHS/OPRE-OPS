from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import CANFundingDetails


class CANFundingDetailsService:
    def _update_fields(self, old_funding_details: CANFundingDetails, funding_update) -> bool:
        """
        Update fields on the CAN based on the fields passed in can_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in funding_update.items():
            if getattr(old_funding_details, attr) != value:
                setattr(old_funding_details, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_funding_funding_request) -> CANFundingDetails:
        """
        Create a new CAN Funding funding and save it to the database
        """
        new_can = CANFundingDetails(**create_funding_funding_request)

        current_app.db_session.add(new_can)
        current_app.db_session.commit()
        return new_can

    def update(self, updated_fields, id: int) -> CANFundingDetails:
        """
        Update a CANFundingDetails with only the provided values in updated_fields.
        """
        try:
            old_details: CANFundingDetails = current_app.db_session.execute(
                select(CANFundingDetails).where(CANFundingDetails.id == id)
            ).scalar_one()

            funding_was_updated = self._update_fields(old_details, updated_fields)
            if funding_was_updated:
                current_app.db_session.add(old_details)
                current_app.db_session.commit()

            return old_details
        except NoResultFound:
            current_app.logger.exception(f"Could not find a CANFundingDetails with id {id}")
            raise NotFound()

    def delete(self, id: int):
        """
        Delete a CANFundingDetails with given id. Throw a NotFound error if no CAN corresponding to that ID exists."""
        try:
            old_details: CANFundingDetails = current_app.db_session.execute(
                select(CANFundingDetails).where(CANFundingDetails.id == id)
            ).scalar_one()
            current_app.db_session.delete(old_details)
            current_app.db_session.commit()
        except NoResultFound:
            current_app.logger.exception(f"Could not find a CANFundingDetails with id {id}")
            raise NotFound()

    def get(self, id: int) -> CANFundingDetails:
        """
        Get an individual CAN Funding funding by id.
        """
        stmt = select(CANFundingDetails).where(CANFundingDetails.id == id).order_by(CANFundingDetails.id)
        funding_funding = current_app.db_session.scalar(stmt)

        if funding_funding:
            return funding_funding
        else:
            current_app.logger.exception(f"Could not find a CAN Funding funding with id {id}")
            raise NotFound()

    def get_list(self) -> list[CANFundingDetails]:
        """
        Get a list of CAN funding fundings, optionally filtered by a search parameter.
        """
        stmt = select(CANFundingDetails).order_by(CANFundingDetails.id)
        results = current_app.db_session.execute(stmt).all()
        return [can for result in results for can in result]
