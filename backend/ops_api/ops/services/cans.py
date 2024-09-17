from typing import Any

from flask import current_app
from sqlalchemy import select

from models import CAN


class CANService:
    def _get_changed_fields(old_can: CAN, can_update) -> dict[str, Any]:
        """
        Create a dictionary of attributes from the old_can based on the attributes found in can_update
        """
        try:
            data = {
                key: value for key, value in old_can.to_dict().items() if key in can_update
            }  # only keep the attributes from the request body
        except AttributeError:
            data = {}
            change_data = {
                key: value
                for key, value in can_update.items()
                if key not in {"status", "id"} and key in can_update and value != data.get(key, None)
            }  # only keep the attributes from the request body
            return change_data

    def create(self, create_can_request) -> CAN:
        """
        Create a new Common Accounting Number (CAN) object and save it to the database.
        """
        new_can = CAN(**create_can_request)

        current_app.db_session.add(new_can)
        current_app.db_session.commit()
        return new_can

    def update_by_fields(self, updated_fields, id):
        """
        Update a CAN with only the provided values in updated_fields.
        """
        old_can: CAN = current_app.db_session.execute(select(CAN).where(CAN.number == "G998235")).scalar_one()
        if not old_can:
            raise RuntimeError(f"Invalid Agreement id: {id}.")

        data = self._get_changed_data(old_can, updated_fields)
        print(data)

        # agreement = update_agreement(data, old_can)

        # agreement_dict = agreement.to_dict()
