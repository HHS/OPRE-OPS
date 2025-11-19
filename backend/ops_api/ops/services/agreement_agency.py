from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from models import AgreementAgency
from ops_api.ops.services.ops_service import ResourceNotFoundError


class AgreementAgencyService:

    def __init__(self, session: Session):
        self.session = session

    def _update_fields(
        self, old_agreement_agency: AgreementAgency, agency_update
    ) -> bool:
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

        self.session.add(new_agreement_agency)
        self.session.commit()
        return new_agreement_agency

    def update(self, updated_fields, id: int) -> AgreementAgency:
        """
        Update an AgreementAgency with only the provided values in updated_fields.
        """
        try:
            old_agreement_agency: AgreementAgency = self.session.execute(
                select(AgreementAgency).where(AgreementAgency.id == id)
            ).scalar_one()

            agency_was_updated = self._update_fields(
                old_agreement_agency, updated_fields
            )
            if agency_was_updated:
                self.session.add(old_agreement_agency)
                self.session.commit()

            return old_agreement_agency
        except NoResultFound as e:
            logger.exception(f"Could not find an AgreementAgency with id {id}")
            raise ResourceNotFoundError() from e

    def delete(self, id: int):
        """
        Delete an AgreementAgency with given id. Throw a NotFound error if no AgreementAgency corresponding to that ID exists.
        """
        try:
            old_agreement_agency: AgreementAgency = self.session.execute(
                select(AgreementAgency).where(AgreementAgency.id == id)
            ).scalar_one()
            self.session.delete(old_agreement_agency)
            self.session.commit()
        except NoResultFound as e:
            logger.exception(f"Could not find an AgreementAgency with id {id}")
            raise ResourceNotFoundError() from e

    def get(self, id: int) -> AgreementAgency:
        """
        Get an individual AgreementAgency by id.
        """
        stmt = select(AgreementAgency).where(AgreementAgency.id == id)
        agreement_agency = self.session.scalar(stmt)

        if agreement_agency:
            return agreement_agency
        else:
            logger.exception(f"Could not find an AgreementAgency with id {id}")
            raise ResourceNotFoundError("AgreementAgency", id)

    def get_list(
        self,
        limit: int = 10,
        offset: int = 0,
        include_servicing_agency: bool = False,
        include_requesting_agency: bool = False,
    ) -> list[AgreementAgency]:
        """
        Get a list of AgreementAgencies, optionally filtered by a search parameter.
        """
        only_servicing = include_servicing_agency and not include_requesting_agency
        only_requesting = include_requesting_agency and not include_servicing_agency
        stmt = select(AgreementAgency).order_by(AgreementAgency.id)
        if only_servicing:
            stmt = stmt.where(AgreementAgency.servicing)  # noqa: E712
        elif only_requesting:
            stmt = stmt.where(AgreementAgency.requesting)  # noqa: E712
        # if both are true or both are false, return all agencies
        stmt = stmt.offset(offset).limit(limit)
        # sort by name ascending to ensure consistent order
        stmt = stmt.order_by(AgreementAgency.name.asc())
        results = self.session.execute(stmt).all()
        return [agreement_agency for result in results for agreement_agency in result]
