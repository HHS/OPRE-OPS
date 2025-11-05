from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from models import ResearchMethodology
from ops_api.ops.services.ops_service import ResourceNotFoundError


class ResearchMethodologyService:

    def __init__(self, session: Session):
        self.session = session

    def _update_fields(
        self, old_research_methodology: ResearchMethodology, research_methodology_update
    ) -> bool:
        """
        Update fields on the ResearchMethodology based on the fields passed in research_methodology_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in research_methodology_update.items():
            if getattr(old_research_methodology, attr) != value:
                setattr(old_research_methodology, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_research_methodology_request) -> ResearchMethodology:
        """
        Create a new ResearchMethodology and save it to the database
        """
        new_research_methodology = ResearchMethodology(
            **create_research_methodology_request
        )

        self.session.add(new_research_methodology)
        self.session.commit()
        return new_research_methodology

    def update(self, updated_fields, id: int) -> ResearchMethodology:
        """
        Update a ResearchMethodology with only the provided values in updated_fields.
        """
        try:
            old_research_methodology: ResearchMethodology = self.session.execute(
                select(ResearchMethodology).where(ResearchMethodology.id == id)
            ).scalar_one()

            methodology_was_updated = self._update_fields(
                old_research_methodology, updated_fields
            )
            if methodology_was_updated:
                self.session.add(old_research_methodology)
                self.session.commit()

            return old_research_methodology
        except NoResultFound as e:
            logger.exception(f"Could not find a ResearchMethodology with id {id}")
            raise ResourceNotFoundError() from e

    def delete(self, id: int):
        """
        Delete a ResearchMethodology with given id. Throw a NotFound error if no ResearchMethodology corresponding to that ID exists.
        """
        try:
            old_research_methodology: ResearchMethodology = self.session.execute(
                select(ResearchMethodology).where(ResearchMethodology.id == id)
            ).scalar_one()
            self.session.delete(old_research_methodology)
            self.session.commit()
        except NoResultFound as e:
            logger.exception(f"Could not find a ResearchMethodology with id {id}")
            raise ResourceNotFoundError() from e

    def get(self, id: int) -> ResearchMethodology:
        """
        Get an individual ResearchMethodology by id.
        """
        stmt = select(ResearchMethodology).where(ResearchMethodology.id == id)
        research_methodology = self.session.scalar(stmt)

        if research_methodology:
            return research_methodology
        else:
            logger.exception(f"Could not find a ResearchMethodology with id {id}")
            raise ResourceNotFoundError("ResearchMethodology", id)

    def get_list(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> list[ResearchMethodology]:
        """
        Get a list of ResearchMethodologies, optionally filtered by a search parameter.
        """
        stmt = select(ResearchMethodology).order_by(ResearchMethodology.name.asc())
        stmt = stmt.offset(offset).limit(limit)
        results = self.session.execute(stmt).all()
        return [
            research_methodology
            for result in results
            for research_methodology in result
        ]
