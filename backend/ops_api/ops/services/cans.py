from typing import cast

from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import InstrumentedAttribute
from werkzeug.exceptions import NotFound

from models import CAN
from ops_api.ops.utils.query_helpers import QueryHelper


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

    def update(self, updated_fields, id: int) -> CAN:
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
        except NoResultFound as err:
            current_app.logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound() from err

    def delete(self, id: int):
        """
        Delete a CAN with given id. Throw a NotFound error if no CAN corresponding to that ID exists."""
        try:
            old_can: CAN = current_app.db_session.execute(select(CAN).where(CAN.id == id)).scalar_one()
            current_app.db_session.delete(old_can)
            current_app.db_session.commit()
        except NoResultFound as err:
            current_app.logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound() from err

    def get(self, id: int) -> CAN:
        """
        Get an individual CAN by id.
        """
        stmt = select(CAN).where(CAN.id == id).order_by(CAN.id)
        can = current_app.db_session.scalar(stmt)

        if can:
            return can
        else:
            current_app.logger.exception(f"Could not find a CAN with id {id}")
            raise NotFound()

    def get_list(self, search=None) -> list[CAN]:
        """
        Get a list of CANs, optionally filtered by a search parameter.
        """
        search_query = self._get_query(search)
        results = current_app.db_session.execute(search_query).all()
        return [can for item in results for can in item]

    @staticmethod
    def _get_query(search=None):
        """
        Construct a search query that can be used to retrieve a list of CANs.
        """
        stmt = select(CAN).order_by(CAN.id)

        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt
