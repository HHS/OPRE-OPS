from typing import Any, Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import ServicesComponent
from models.budget_line_items import BudgetLineItemStatus
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import associated_with_agreement


class ServicesComponentService:
    """Service for managing Services Component resources."""

    def __init__(self, db_session: Session):
        """
        Initialize the ServicesComponentService.

        :param db_session: The SQLAlchemy session to use for database operations.
        """
        self.db_session = db_session

    def get(self, obj_id: int) -> ServicesComponent:
        """
        Get a single services component by ID.

        Args:
            obj_id: The ID of the services component to retrieve

        Returns:
            The services component instance

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
        """
        services_component: ServicesComponent | None = self.db_session.get(ServicesComponent, obj_id)
        if not services_component:
            raise ResourceNotFoundError("ServicesComponent", obj_id)
        return services_component

    def get_list(self, data: dict | None = None) -> tuple[Sequence[ServicesComponent], dict | None]:
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
        services_components: Sequence[ServicesComponent] | None = self.db_session.scalars(query).all()

        # Return results with no additional metadata
        return services_components, None

    def create(self, create_request: dict[str, Any], commit: bool = True) -> ServicesComponent:
        """
        Create a new services component.

        Args:
            create_request: Dictionary containing the data for the new services component
            commit: When False, the SC is added (and flushed to assign id) but not committed.
                The caller is responsible for the eventual commit (used by the edit-bundle
                orchestrator).

        Returns:
            The newly created services component

        Raises:
            Forbidden: If the user is not authorized to create with the given agreement_id
        """
        if not associated_with_agreement(create_request.get("agreement_id")):
            raise AuthorizationError("User not authorized to create Services Component with this Agreement")

        new_sc = ServicesComponent(**create_request)

        self._validate_bli_pop_window_for_create(create_request)

        try:
            self.db_session.add(new_sc)
            if commit:
                self.db_session.commit()
            else:
                self.db_session.flush()
        except IntegrityError as e:
            if commit:
                self.db_session.rollback()
            raise ValidationError({"number": ["Services Component with this number already exists"]}) from e

        return new_sc

    def update(self, obj_id: int, updated_fields: dict[str, Any], commit: bool = True) -> tuple[ServicesComponent, int]:
        """
        Update an existing services component.

        Args:
            obj_id: The ID of the services component to update
            updated_fields: Dictionary containing the fields to update

        Returns:
            Tuple containing the updated services component and status code (200)

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
            Forbidden: If the user is not authorized to update this services component
        """
        if not self._sc_associated_with_agreement(obj_id):
            raise AuthorizationError("User not authorized to update Services Component with this Agreement")

        services_component = self.db_session.get(ServicesComponent, obj_id)
        if not services_component:
            raise ResourceNotFoundError("ServicesComponent", obj_id)

        if "id" in updated_fields and obj_id != updated_fields.get("id"):
            raise ValidationError({"id": ["ID cannot be changed"]})

        if "agreement_id" in updated_fields and services_component.agreement_id != updated_fields.get("agreement_id"):
            raise ValidationError({"agreement_id": ["Agreement ID cannot be changed"]})

        period_start_changing = "period_start" in updated_fields and updated_fields["period_start"] != services_component.period_start
        period_end_changing = "period_end" in updated_fields and updated_fields["period_end"] != services_component.period_end

        if period_start_changing or period_end_changing:
            self._validate_bli_pop_window(services_component, updated_fields)

        updated_fields["id"] = obj_id  # Ensure ID is included for update

        updated_service_component = ServicesComponent(**updated_fields)

        try:
            self.db_session.merge(updated_service_component)
            if commit:
                self.db_session.commit()
            else:
                self.db_session.flush()
        except IntegrityError as e:
            if commit:
                self.db_session.rollback()
            raise ValidationError({"number": ["Services Component with this number already exists"]}) from e

        return updated_service_component, 200

    def delete(self, obj_id: int, commit: bool = True) -> None:
        """
        Delete a services component.

        Args:
            obj_id: The ID of the services component to delete

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
            Forbidden: If the user is not authorized to delete this services component
        """
        if not self._sc_associated_with_agreement(obj_id):
            raise AuthorizationError("User not authorized to delete Services Component with this Agreement")

        services_component = self.get(obj_id)

        self.db_session.delete(services_component)
        if commit:
            self.db_session.commit()

    def _validate_bli_pop_window_for_create(self, create_request: dict[str, Any]) -> None:
        """
        Validate that all non-draft BLIs on the agreement fall within the window
        defined by the new SC being created, combined with any existing SCs.

        Raises:
            ValidationError: if any non-draft BLI would fall outside the resulting window.
        """
        from models import Agreement

        agreement_id = create_request.get("agreement_id")
        if not agreement_id:
            return

        agreement = self.db_session.get(Agreement, agreement_id)
        if not agreement:
            return

        new_start = create_request.get("period_start")
        new_end = create_request.get("period_end")

        all_starts = [sc.period_start for sc in agreement.services_components if sc.period_start]
        all_ends = [sc.period_end for sc in agreement.services_components if sc.period_end]
        if new_start:
            all_starts.append(new_start)
        if new_end:
            all_ends.append(new_end)

        window_start = min(all_starts) if all_starts else None
        window_end = max(all_ends) if all_ends else None

        non_draft_blis = [
            bli
            for bli in agreement.budget_line_items
            if bli.status != BudgetLineItemStatus.DRAFT and bli.date_needed is not None
        ]

        if not non_draft_blis or (window_start is None and window_end is None):
            return

        affected = [
            bli
            for bli in non_draft_blis
            if (window_start and bli.date_needed < window_start) or (window_end and bli.date_needed > window_end)
        ]

        if affected:
            affected_ids = ", ".join(str(bli.id) for bli in affected)
            raise ValidationError(
                {
                    "period_start": [
                        f"Budget Line Items {affected_ids} fall outside the updated Period of Performance window."
                    ]
                }
            )

    def _validate_bli_pop_window(self, services_component: ServicesComponent, updated_fields: dict[str, Any]) -> None:
        """
        Validate that all non-draft BLIs on the agreement still fall within the SC PoP window
        after applying the proposed period_start / period_end changes.

        The window is the union of all SC periods on the agreement, with the SC being updated
        replaced by its proposed new dates.

        Raises:
            ValidationError: listing the affected BLI IDs if any would fall outside the window.
        """
        agreement = services_component.agreement

        new_start = updated_fields.get("period_start", services_component.period_start)
        new_end = updated_fields.get("period_end", services_component.period_end)

        # Build the overall window across all SCs, substituting the proposed dates for this SC.
        all_starts = []
        all_ends = []
        for sc in agreement.services_components:
            start = new_start if sc.id == services_component.id else sc.period_start
            end = new_end if sc.id == services_component.id else sc.period_end
            if start:
                all_starts.append(start)
            if end:
                all_ends.append(end)

        window_start = min(all_starts) if all_starts else None
        window_end = max(all_ends) if all_ends else None

        non_draft_blis = [
            bli
            for bli in agreement.budget_line_items
            if bli.status != BudgetLineItemStatus.DRAFT and bli.date_needed is not None
        ]

        if not non_draft_blis or (window_start is None and window_end is None):
            return

        affected = [
            bli
            for bli in non_draft_blis
            if (window_start and bli.date_needed < window_start) or (window_end and bli.date_needed > window_end)
        ]

        if affected:
            affected_ids = ", ".join(str(bli.id) for bli in affected)
            raise ValidationError(
                {
                    "period_start": [
                        f"Budget Line Items {affected_ids} fall outside the updated Period of Performance window."
                    ]
                }
            )

    def _sc_associated_with_agreement(self, obj_id: int) -> bool:
        """
        Check if services component is associated with an agreement the user has access to.

        Args:
            obj_id: The ID of the services component

        Returns:
            True if the user is authorized, otherwise raises an exception

        Raises:
            ExtraCheckError: If the services component has no agreement
            ResourceNotFoundError: If the services component doesn't exist
        """
        sc: ServicesComponent | None = self.db_session.get(ServicesComponent, obj_id)
        if not sc:
            raise ResourceNotFoundError("ServicesComponent", obj_id)

        if not sc.agreement_id:
            raise ExtraCheckError({"_schema": ["Services Component must have an Agreement"]})

        return associated_with_agreement(sc.agreement.id)
