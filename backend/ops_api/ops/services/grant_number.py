from typing import Any, Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import GrantNumber
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import associated_with_agreement


class GrantNumberService:
    """Service for managing Grant Number resources."""

    def __init__(self, db_session: Session):
        """
        Initialize the GrantNumberService.

        :param db_session: The SQLAlchemy session to use for database operations.
        """
        self.db_session = db_session

    def get(self, obj_id: int) -> GrantNumber:
        """
        Get a single grant number by ID.

        Args:
            obj_id: The ID of the grant number to retrieve

        Returns:
            The grant number instance

        Raises:
            ResourceNotFoundError: If the grant number doesn't exist
        """
        grant_number: GrantNumber | None = self.db_session.get(GrantNumber, obj_id)
        if not grant_number:
            raise ResourceNotFoundError("GrantNumber", obj_id)
        return grant_number

    def get_list(self, data: dict | None = None) -> tuple[Sequence[GrantNumber], dict | None]:
        """
        Get a list of grant numbers with optional filtering.

        Args:
            data: Optional filter parameters, like agreement_id

        Returns:
            A tuple containing the list of grant numbers and metadata
        """
        query = select(GrantNumber)

        if data:
            if data.get("agreement_id"):
                query = query.where(GrantNumber.agreement_id == data.get("agreement_id"))

        grant_numbers: Sequence[GrantNumber] | None = self.db_session.scalars(query).all()

        return grant_numbers, None

    def create(self, create_request: dict[str, Any], commit: bool = True) -> GrantNumber:
        """
        Create a new grant number.

        Args:
            create_request: Dictionary containing the data for the new grant number
            commit: When False, the grant number is added (and flushed to assign id) but not
                committed. The caller is responsible for the eventual commit (used by the
                edit-bundle orchestrator).

        Returns:
            The newly created grant number

        Raises:
            AuthorizationError: If the user is not authorized to create with the given agreement_id
        """
        if not associated_with_agreement(create_request.get("agreement_id")):
            raise AuthorizationError("User not authorized to create Grant Number with this Agreement")

        new_gn = GrantNumber(**create_request)

        try:
            self.db_session.add(new_gn)
            if commit:
                self.db_session.commit()
            else:
                self.db_session.flush()
        except IntegrityError as e:
            if commit:
                self.db_session.rollback()
            raise ValidationError(
                {"number": ["A Grant Number with this number already exists for this agreement."]}
            ) from e

        return new_gn

    def update(self, obj_id: int, updated_fields: dict[str, Any], commit: bool = True) -> tuple[GrantNumber, int]:
        """
        Update an existing grant number.

        Args:
            obj_id: The ID of the grant number to update
            updated_fields: Dictionary containing the fields to update

        Returns:
            Tuple containing the updated grant number and status code (200)

        Raises:
            ResourceNotFoundError: If the grant number doesn't exist
            AuthorizationError: If the user is not authorized to update this grant number
        """
        if not self._gn_associated_with_agreement(obj_id):
            raise AuthorizationError("User not authorized to update Grant Number with this Agreement")

        grant_number = self.db_session.get(GrantNumber, obj_id)
        if not grant_number:
            raise ResourceNotFoundError("GrantNumber", obj_id)

        if "id" in updated_fields and obj_id != updated_fields.get("id"):
            raise ValidationError({"id": ["ID cannot be changed"]})

        if "agreement_id" in updated_fields and grant_number.agreement_id != updated_fields.get("agreement_id"):
            raise ValidationError({"agreement_id": ["Agreement ID cannot be changed"]})

        updated_fields["id"] = obj_id  # Ensure ID is included for update

        updated_grant_number = GrantNumber(**updated_fields)

        try:
            self.db_session.merge(updated_grant_number)
            if commit:
                self.db_session.commit()
            else:
                self.db_session.flush()
        except IntegrityError as e:
            if commit:
                self.db_session.rollback()
            raise ValidationError(
                {"number": ["A Grant Number with this number already exists for this agreement."]}
            ) from e

        return updated_grant_number, 200

    def delete(self, obj_id: int, commit: bool = True) -> None:
        """
        Delete a grant number.

        Args:
            obj_id: The ID of the grant number to delete

        Raises:
            ResourceNotFoundError: If the grant number doesn't exist
            AuthorizationError: If the user is not authorized to delete this grant number
        """
        if not self._gn_associated_with_agreement(obj_id):
            raise AuthorizationError("User not authorized to delete Grant Number with this Agreement")

        grant_number = self.get(obj_id)

        self.db_session.delete(grant_number)
        if commit:
            self.db_session.commit()

    def _gn_associated_with_agreement(self, obj_id: int) -> bool:
        """
        Check if grant number is associated with an agreement the user has access to.

        Args:
            obj_id: The ID of the grant number

        Returns:
            True if the user is authorized, otherwise raises an exception

        Raises:
            ExtraCheckError: If the grant number has no agreement
            ResourceNotFoundError: If the grant number doesn't exist
        """
        gn: GrantNumber | None = self.db_session.get(GrantNumber, obj_id)
        if not gn:
            raise ResourceNotFoundError("GrantNumber", obj_id)

        if not gn.agreement_id:
            raise ExtraCheckError({"_schema": ["Grant Number must have an Agreement"]})

        return associated_with_agreement(gn.agreement.id)
