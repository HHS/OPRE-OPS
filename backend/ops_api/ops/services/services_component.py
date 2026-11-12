from typing import Any, Sequence

from flask_jwt_extended import get_current_user
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import Agreement, ServicesComponent
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
from ops_api.ops.utils.budget_line_items_helpers import (
    get_agreement_pre_award_lock_message,
    sc_requires_approval_gate,
)

IN_REVIEW_MESSAGE = (
    "This services component is pending approval and will require a contract modification. "
    "It can't be changed until the Division Director reviews it."
)
AWARDED_DELETE_BLOCKED_MESSAGE = "Services Components with budget lines cannot be deleted on awarded agreements."


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

        agreement = self.db_session.get(Agreement, create_request.get("agreement_id"))
        self._check_pre_award_lock(agreement)

        new_sc = ServicesComponent(**create_request)
        # Added after award: the addition needs Division Director approval and goes on the
        # contract modification once approved (OPS-6440).
        needs_approval = sc_requires_approval_gate(agreement)
        new_sc.awaiting_add_approval = needs_approval

        try:
            self.db_session.add(new_sc)
            self.db_session.flush()
        except IntegrityError as e:
            if commit:
                self.db_session.rollback()
            raise ValidationError({"number": ["Services Component with this number already exists"]}) from e

        if needs_approval:
            # Commits with the SC (and notifies) when commit=True.
            ChangeRequestService(self.db_session).add_services_component_create_change_request(new_sc, commit=commit)
        elif commit:
            self.db_session.commit()

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

        self._check_pre_award_lock(services_component.agreement)
        self._check_not_in_review(services_component)

        if "id" in updated_fields and obj_id != updated_fields.get("id"):
            raise ValidationError({"id": ["ID cannot be changed"]})

        if "agreement_id" in updated_fields and services_component.agreement_id != updated_fields.get("agreement_id"):
            raise ValidationError({"agreement_id": ["Agreement ID cannot be changed"]})

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

    def delete(self, obj_id: int, commit: bool = True) -> int | None:
        """
        Delete a services component.

        On an Awarded agreement (OPS-6440), an SC with non-Draft budget lines can only be deleted
        by a superuser, and any other delete goes to Division Director approval: the SC stays
        until approved. That includes an SC whose approved addition isn't in a modification yet,
        so the Division Director knows it's being removed; on approval, its pending "Add SC" edit
        is removed with it (see ``ChangeRequestService._apply_services_component_review``).

        Args:
            obj_id: The ID of the services component to delete

        Returns:
            The delete change request id when the delete went to approval, otherwise None

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
            Forbidden: If the user is not authorized to delete this services component
            ValidationError: If the SC is in review, is blocked on an Awarded agreement, or its
                addition is in a contract modification in review
        """
        if not self._sc_associated_with_agreement(obj_id):
            raise AuthorizationError("User not authorized to delete Services Component with this Agreement")

        services_component = self.get(obj_id)
        self._check_pre_award_lock(services_component.agreement)
        change_request_service = ChangeRequestService(self.db_session)
        change_request_service.lock_services_component(obj_id)
        # The flag was read before the lock; an add approval that committed while we waited may have cleared it.
        self.db_session.refresh(services_component, attribute_names=["awaiting_add_approval"])
        self._check_not_in_review(services_component)

        if self.delete_blocked(services_component):
            raise ValidationError({"services_component": [AWARDED_DELETE_BLOCKED_MESSAGE]})
        if self.delete_requires_approval(services_component):
            ContractModificationEditService(self.db_session).check_services_component_addition_not_in_review(obj_id)
            return change_request_service.add_services_component_delete_change_request(
                services_component, commit=commit
            )
        ContractModificationEditService(self.db_session).discard_pending_services_component_addition(obj_id)

        self.db_session.delete(services_component)
        if commit:
            self.db_session.commit()
        return None

    def delete_requires_approval(self, services_component: ServicesComponent) -> bool:
        """Whether deleting this (not blocked) SC goes to Division Director approval (OPS-6440).

        It does on a gated Awarded agreement, unless the SC's own addition hasn't been approved
        yet: the Division Director never approved it, so the delete is direct. An SC whose
        addition was approved still goes to approval, even if that addition isn't in a
        modification yet.
        """
        if not sc_requires_approval_gate(services_component.agreement):
            return False
        return not services_component.awaiting_add_approval

    @staticmethod
    def delete_blocked(services_component: ServicesComponent) -> bool:
        """Whether this SC can't be deleted: it has non-Draft budget lines on an Awarded agreement
        and the user isn't a superuser."""
        return sc_requires_approval_gate(services_component.agreement) and services_component.has_non_draft_budget_lines

    @staticmethod
    def _check_not_in_review(services_component: ServicesComponent) -> None:
        if services_component.in_review:
            raise ValidationError({"services_component": [IN_REVIEW_MESSAGE]})

    @staticmethod
    def _check_pre_award_lock(agreement: Agreement | None) -> None:
        """Services components are part of the agreement, so they share its pre-award locks."""
        message = get_agreement_pre_award_lock_message(agreement, get_current_user())
        if message:
            raise ValidationError({"services_component": [message]})

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
