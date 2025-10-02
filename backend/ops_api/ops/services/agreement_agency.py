from flask import current_app
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import AgreementAgency


class AgreementAgencyService:
    def _update_fields(self, old_agreement_agency: AgreementAgency, agency_update) -> bool:
        """
        Update fields on the AgreementAgency based on the fields passed in agency_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in agency_update.items():
            if getattr(old_agreement_agency, attr) != value:
                setattr(old_agreement_agency, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_agreement_agency_request) -> AgreementAgency:
        """
        Create a new AgreementAgency and save it to the database
        """
        new_agreement_agency = AgreementAgency(**create_agreement_agency_request)

        current_app.db_session.add(new_agreement_agency)
        current_app.db_session.commit()
        return new_agreement_agency

    def update(self, updated_fields, id: int) -> AgreementAgency:
        """
        Update a AgreementAgency with only the provided values in updated_fields.
        """
        try:
            old_agreement_agency: AgreementAgency = current_app.db_session.execute(
                select(AgreementAgency).where(AgreementAgency.id == id)
            ).scalar_one()

            agency_was_updated = self._update_fields(old_agreement_agency, updated_fields)
            if agency_was_updated:
                current_app.db_session.add(old_agreement_agency)
                current_app.db_session.commit()

            return old_agreement_agency
        except NoResultFound as err:
            logger.exception(f"Could not find a AgreementAgency with id {id}")
            raise NotFound() from err

    def delete(self, id: int):
        """
        Delete a AgreementAgency with given id. Throw a NotFound error if no AgreementAgency corresponding to that ID exists.
        """
        try:
            old_agreement_agency: AgreementAgency = current_app.db_session.execute(
                select(AgreementAgency).where(AgreementAgency.id == id)
            ).scalar_one()
            current_app.db_session.delete(old_agreement_agency)
            current_app.db_session.commit()
        except NoResultFound as err:
            logger.exception(f"Could not find a AgreementAgency with id {id}")
            raise NotFound() from err

    def get(self, id: int) -> AgreementAgency:
        """
        Get an individual AgreementAgency by id.
        """
        stmt = select(AgreementAgency).where(AgreementAgency.id == id).order_by(AgreementAgency.id)
        agreement_agency = current_app.db_session.scalar(stmt)

        if agreement_agency:
            return agreement_agency
        else:
            logger.exception(f"Could not find a AgreementAgency with id {id}")
            raise NotFound()

    def get_list(self) -> list[AgreementAgency]:
        """
        Get a list of AgreementAgencies, optionally filtered by a search parameter.
        """
        stmt = select(AgreementAgency).order_by(AgreementAgency.id)
        results = current_app.db_session.execute(stmt).all()
        return [agreement_agency for result in results for agreement_agency in result]
