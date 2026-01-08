from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from models import SpecialTopic
from ops_api.ops.services.ops_service import ResourceNotFoundError


class SpecialTopicsService:
    def __init__(self, session: Session):
        self.session = session

    def _update_fields(self, old_special_topic: SpecialTopic, special_topic_update) -> bool:
        """
        Update fields on the SpecialTopic based on the fields passed in special_topic_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in special_topic_update.items():
            if getattr(old_special_topic, attr) != value:
                setattr(old_special_topic, attr, value)
                is_changed = True

        return is_changed

    def create(self, create_special_topic_request) -> SpecialTopic:
        """
        Create a new SpecialTopic and save it to the database
        """
        new_special_topic = SpecialTopic(**create_special_topic_request)

        self.session.add(new_special_topic)
        self.session.commit()
        return new_special_topic

    def update(self, updated_fields, id: int) -> SpecialTopic:
        """
        Update a SpecialTopic with only the provided values in updated_fields.
        """
        try:
            old_special_topic: SpecialTopic = self.session.get(SpecialTopic, id)

            topic_was_updated = self._update_fields(old_special_topic, updated_fields)
            if topic_was_updated:
                self.session.add(old_special_topic)
                self.session.commit()

            return old_special_topic
        except NoResultFound as e:
            logger.exception(f"Could not find a SpecialTopic with id {id}")
            raise ResourceNotFoundError("SpecialTopic", id) from e

    def delete(self, id: int):
        """
        Delete a SpecialTopic with given id. Throw a NotFound error if no SpecialTopic corresponding to that ID exists.
        """
        try:
            old_special_topic: SpecialTopic = self.session.get(SpecialTopic, id)
            self.session.delete(old_special_topic)
            self.session.commit()
        except NoResultFound as e:
            logger.exception(f"Could not find a SpecialTopic with id {id}")
            raise ResourceNotFoundError("SpecialTopic", id) from e

    def get(self, id: int) -> SpecialTopic:
        """
        Get an individual SpecialTopic by id.
        """
        special_topic = self.session.get(SpecialTopic, id)

        if special_topic:
            return special_topic
        else:
            logger.exception(f"Could not find a SpecialTopic with id {id}")
            raise ResourceNotFoundError("SpecialTopic", id)

    def get_list(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> list[SpecialTopic]:
        """
        Get a list of SpecialTopics with pagination.
        """
        stmt = select(SpecialTopic).order_by(SpecialTopic.name.asc())
        stmt = stmt.offset(offset).limit(limit)
        results = self.session.execute(stmt).all()
        return [special_topic for result in results for special_topic in result]
