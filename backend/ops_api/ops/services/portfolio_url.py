from flask import current_app
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from werkzeug.exceptions import NotFound

from models import PortfolioUrl


class PortfolioUrlService:
    def _update_fields(self, old_portfolio_url: PortfolioUrl, portfolio_url_update) -> bool:
        """
        Update fields on the PortfolioUrl based on the fields passed in portfolio_url_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in portfolio_url_update.items():
            if getattr(old_portfolio_url, attr) != value:
                setattr(old_portfolio_url, attr, value)
                is_changed = True

        return is_changed

    def create(self, portfolio_url_request) -> PortfolioUrl:
        """
        Create a new PortfolioUrl object and save it to the database
        """
        new_portfolio_url = PortfolioUrl(**portfolio_url_request)

        current_app.db_session.add(new_portfolio_url)
        current_app.db_session.commit()
        return new_portfolio_url

    def update(self, updated_fields, id: int) -> PortfolioUrl:
        """
        Update a PortfolioUrl object with only the provided values in updated_fields.
        """
        try:
            old_portfolio_url: PortfolioUrl = current_app.db_session.execute(
                select(PortfolioUrl).where(PortfolioUrl.id == id)
            ).scalar_one()

            portfolio_url_was_updated = self._update_fields(old_portfolio_url, updated_fields)
            if portfolio_url_was_updated:
                current_app.db_session.add(old_portfolio_url)
                current_app.db_session.commit()

            return old_portfolio_url
        except NoResultFound as e:
            current_app.logger.exception(f"Could not find a PortfolioUrl with id {id}")
            raise NotFound() from e

    def delete(self, id: int) -> PortfolioUrl:
        """
        Delete a PortfolioUrl with given id. Throw a NotFound error if no Portfolio corresponding to that ID exists."""
        try:
            old_portfolio_url = current_app.db_session.get(PortfolioUrl, id)

            if old_portfolio_url is None:
                raise NotFound(f"No PortfolioUrl found with id {id}")

            current_app.db_session.delete(old_portfolio_url)
            current_app.db_session.commit()

            return old_portfolio_url

        except NotFound as e:
            current_app.logger.exception(f"Could not find a PortfolioUrl with id {id}")
            raise e from e

    def get(self, id: int) -> PortfolioUrl:
        """
        Get an individual PortfolioUrl object by id.
        """
        stmt = select(PortfolioUrl).where(PortfolioUrl.id == id)
        portfolio_url = current_app.db_session.scalar(stmt)

        if portfolio_url:
            return portfolio_url
        else:
            current_app.logger.exception(f"Could not find a PortfolioUrl with id {id}")
            raise NotFound()

    def get_list(self) -> list[PortfolioUrl]:
        """
        Get a list of PortfolioUrl objects.
        """
        stmt = select(PortfolioUrl).order_by(PortfolioUrl.id)
        results = current_app.db_session.execute(stmt).all()
        return [portfolio for result in results for portfolio in result]
