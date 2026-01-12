from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.procurement_shops import ProcurementShop
from ops_api.ops.services.ops_service import ResourceNotFoundError


class ProcurementShopService:
    """Service for managing Procurement Shop resources."""

    def __init__(self, db_session: Session):
        """
        Initialize the ProcurementShopService.

        :param db_session:  The SQLAlchemy session to use for database operations.
        """
        self.db_session = db_session

    def get(self, id: int) -> ProcurementShop:
        """
        Get a single procurement shop by ID.

        Args:
            id: The ID of the procurement shop to retrieve

        Returns:
            The procurement shop instance

        Raises:
            ResourceNotFoundError: If the procurement shop doesn't exist
        """
        procurement_shop = self.db_session.get(ProcurementShop, id)
        if not procurement_shop:
            raise ResourceNotFoundError("ProcurementShop", id)
        return procurement_shop

    def get_list(self, data: dict | None = None) -> tuple[list[ProcurementShop], dict | None]:
        """
        Get a list of procurement shops with optional filtering.

        Args:
            data: Optional filter parameters

        Returns:
            A tuple containing the list of procurement shops and metadata
        """
        query = select(ProcurementShop)

        # Handle filters if provided
        if data:
            # Add filter conditions based on data dictionary
            # Example: if data.get("name"):
            #     query = query.filter(ProcurementShop.name.ilike(f"%{data['name']}%"))
            pass

        # Execute query
        procurement_shops = self.db_session.scalars(query).all()

        # Return results with no additional metadata
        return procurement_shops, None

    def create(self, create_request: dict[str, Any]) -> ProcurementShop:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[ProcurementShop, int]:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")

    def delete(self, id: int) -> None:
        """Required by OpsService protocol but not implemented yet."""
        raise NotImplementedError("Method not implemented")
