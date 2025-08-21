from typing import Any

from flask import request
from sqlalchemy import select
from sqlalchemy.orm import Session
from werkzeug.exceptions import Forbidden

from models import ServicesComponent
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.agreements_helpers import associated_with_agreement


class ServicesComponentService:
    """Service for managing Services Component resources."""

    def __init__(self, db_session: Session):
        """
        Initialize the ServicesComponentService.

        :param db_session: The SQLAlchemy session to use for database operations.
        """
        self.db_session = db_session

    def get(self, id: int) -> ServicesComponent:
        """
        Get a single services component by ID.

        Args:
            id: The ID of the services component to retrieve

        Returns:
            The services component instance

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
        """
        services_component = self.db_session.get(ServicesComponent, id)
        if not services_component:
            raise ResourceNotFoundError("ServicesComponent", id)
        return services_component

    def get_list(self, data: dict | None = None) -> tuple[list[ServicesComponent], dict | None]:
        """
        Get a list of services components with optional filtering.

        Args:
            data: Optional filter parameters, like agreement_id

        Returns:
            A tuple containing the list of services components and metadata
        """
        query = select(ServicesComponent)

        # Handle filters if provided
        if data:
            if data.get("agreement_id"):
                query = query.where(ServicesComponent.agreement_id == data.get("agreement_id"))

        # Execute query
        services_components = self.db_session.scalars(query).all()

        # Return results with no additional metadata
        return services_components, None

    def sc_associated_with_agreement(self, id: int, method: str) -> bool:
        """
        Check if services component is associated with an agreement the user has access to.

        Args:
            id: The ID of the services component
            method: The HTTP method (PUT, PATCH, DELETE)

        Returns:
            True if the user is authorized, otherwise raises an exception

        Raises:
            ExtraCheckError: If the services component has no agreement
            ResourceNotFoundError: If the services component doesn't exist
        """
        sc: ServicesComponent = self.db_session.get(ServicesComponent, id)
        if not sc:
            raise ResourceNotFoundError("ServicesComponent", id)

        try:
            agreement = sc.agreement
        except AttributeError as e:
            raise ExtraCheckError({}) from e

        if agreement is None:
            if method == "PUT":
                raise ExtraCheckError(
                    {
                        "_schema": ["Services Component must have an Agreement"],
                        "agreement_id": ["Missing data for required field."],
                    }
                )
            elif method == "PATCH":
                raise ExtraCheckError({"_schema": ["Services Component must have an Agreement"]})
            else:
                raise ExtraCheckError({})

        return associated_with_agreement(agreement.id)

    def create(self, create_request: dict[str, Any]) -> ServicesComponent:
        """
        Create a new services component.

        Args:
            create_request: Dictionary containing the data for the new services component

        Returns:
            The newly created services component

        Raises:
            Forbidden: If the user is not authorized to create with the given agreement_id
        """
        if not associated_with_agreement(create_request.get("agreement_id")):
            raise AuthorizationError("User not authorized to create Services Component with this Agreement")

        # data = convert_date_strings_to_dates(create_request)
        new_sc = ServicesComponent(**create_request)

        self.db_session.add(new_sc)
        self.db_session.commit()

        return new_sc

    def update(self, id: int, updated_fields: dict[str, Any]) -> ServicesComponent:
        """
        Update an existing services component.

        Args:
            id: The ID of the services component to update
            updated_fields: Dictionary containing the fields to update

        Returns:
            Tuple containing the updated services component and list of changed fields

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
            Forbidden: If the user is not authorized to update this services component
        """
        # method = "PATCH" if len(updated_fields) < 5 else "PUT"  # Simplistic way to determine method

        if not self.sc_associated_with_agreement(id, request.method):
            raise AuthorizationError("User not authorized to update Services Component with this Agreement")

        services_component = self.db_session.get(ServicesComponent, id)
        if not services_component:
            raise ResourceNotFoundError("ServicesComponent", id)

        if "id" in updated_fields and id != updated_fields.get("id"):
            raise ValidationError({"id": ["ID cannot be changed"]})

        if "agreement_id" in updated_fields and services_component.agreement_id != updated_fields.get("agreement_id"):
            raise ValidationError({"agreement_id": ["Agreement ID cannot be changed"]})

        updated_fields["id"] = id  # Ensure ID is included for update

        updated_service_component = ServicesComponent(**updated_fields)
        self.db_session.merge(updated_service_component)
        self.db_session.commit()

        return updated_service_component

    def delete(self, id: int) -> None:
        """
        Delete a services component.

        Args:
            id: The ID of the services component to delete

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
            Forbidden: If the user is not authorized to delete this services component
        """
        if not self.sc_associated_with_agreement(id, "DELETE"):
            raise Forbidden("User not authorized to delete this Services Component")

        services_component = self.get(id)

        self.db_session.delete(services_component)
        self.db_session.commit()
