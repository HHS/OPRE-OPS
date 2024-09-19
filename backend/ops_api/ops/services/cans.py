from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import CAN


class CANService:
    def _update_fields(self, old_can: CAN, can_update) -> bool:
        """
        Update fields on the CAN based on the fields passed in can_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in can_update.items():
            if getattr(old_can, attr) != value:
                setattr(old_can, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_can_request) -> CAN:
        """
        Create a new Common Accounting Number (CAN) object and save it to the database.
        """
        new_can = CAN(**create_can_request)

        current_app.db_session.add(new_can)
        current_app.db_session.commit()
        return new_can

    def update_by_fields(self, updated_fields, id) -> CAN:
        """
        Update a CAN with only the provided values in updated_fields.
        """
        try:
            old_can: CAN = current_app.db_session.execute(select(CAN).where(CAN.id == id)).scalar_one()

            can_was_updated = self._update_fields(old_can, updated_fields)
            if can_was_updated:
                current_app.db_session.add(old_can)
                current_app.db_session.commit()

            return old_can
        except NoResultFound:
            current_app.logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound()
