from typing import Any, Sequence

from flask_jwt_extended import get_current_user
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import Agreement, BudgetLineItem, BudgetLineItemStatus, ServicesComponent
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.contract_modification_edits import (
    BLI_IN_REVIEW_MODIFICATION_MESSAGE,
    SC_IN_REVIEW_MODIFICATION_MESSAGE,
    SERVICES_COMPONENT_TRACKED_FIELDS,
    ContractModificationEditService,
)
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

# On an Awarded agreement the SC's identity -- its number, and whether it's optional or a
# sub-component -- is what the contract refers to, so it can't change (OPS-3268). Superusers bypass.
AWARDED_LOCKED_FIELDS = ("number", "optional", "sub_component")
AWARDED_LOCKED_MESSAGE = "This can't be changed after the agreement is awarded."
HAS_EXECUTING_BUDGET_LINES_MESSAGE = (
    "This services component has Executing or Obligated budget lines. "
    "Move them to another services component before deleting it."
)


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

        try:
            self.db_session.add(new_sc)
            self.db_session.flush()
            # Added after award: recorded immediately, with no budget lines required
            # (OPS-3072/OPS-3268 UX feedback item 5 -- an SC add/delete is tracked on its own,
            # not only once a non-Draft budget line makes it "real").
            if sc_requires_approval_gate(agreement):
                ContractModificationEditService(self.db_session).record_services_component_add(
                    new_sc, get_current_user().id
                )
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

        self._check_pre_award_lock(services_component.agreement)
        self._check_not_in_review(services_component)

        self._check_immutable_fields(services_component, updated_fields)
        tracked_changes = self._awarded_tracked_changes(services_component, updated_fields)

        updated_fields["id"] = obj_id  # Ensure ID is included for update

        updated_service_component = ServicesComponent(**updated_fields)

        try:
            # Period-of-performance edits on an Awarded agreement apply directly and are tracked
            # as Modified LOE edits for the next contract modification (OPS-3268).
            edit_service = ContractModificationEditService(self.db_session)
            for field, (old_value, new_value) in tracked_changes.items():
                edit_service.record_services_component_edit(
                    services_component, field, old_value, new_value, get_current_user().id
                )
            self.db_session.merge(updated_service_component)
            if commit:
                self.db_session.commit()
            else:
                self.db_session.flush()
        except IntegrityError as e:
            if commit:
                self.db_session.rollback()
            raise ValidationError({"number": ["Services Component with this number already exists"]}) from e
        except ValidationError:
            if commit:
                self.db_session.rollback()
            raise

        return updated_service_component, 200

    def delete(self, obj_id: int, commit: bool = True) -> None:
        """
        Delete a services component.

        On an Awarded, tracked agreement, a non-superuser's delete is recorded as an "Edit That
        Requires a Contract Modification" (OPS-3072/OPS-3268 UX feedback item 5), with no
        Division Director approval and no requirement that it have any non-Draft budget lines.
        The exception: an SC still carrying its pending "Add SC" edit was never on the contract,
        so the add is discarded and no delete is recorded (net zero). Superusers bypass tracking,
        the same as on create.

        Args:
            obj_id: The ID of the services component to delete
            commit: When False, the delete flushes instead of committing (edit-bundle flow).

        Raises:
            ResourceNotFoundError: If the services component doesn't exist
            Forbidden: If the user is not authorized to delete this services component
            ValidationError: If the SC is in review, or its addition is in a contract
                modification that is in review
        """
        if not self._sc_associated_with_agreement(obj_id):
            raise AuthorizationError("User not authorized to delete Services Component with this Agreement")

        services_component = self.get(obj_id)
        self._check_pre_award_lock(services_component.agreement)
        ChangeRequestService(self.db_session).lock_services_component(obj_id)
        self._check_not_in_review(services_component)
        self._check_not_in_review_modification(obj_id)
        self._check_no_executing_budget_lines(obj_id)

        if sc_requires_approval_gate(services_component.agreement):
            ContractModificationEditService(self.db_session).record_services_component_delete(
                services_component, get_current_user().id
            )
        else:
            edit_service = ContractModificationEditService(self.db_session)
            edit_service.discard_pending_services_component_addition(obj_id)
            edit_service.discard_pending_services_component_edits(obj_id)

        self.db_session.delete(services_component)
        if commit:
            self.db_session.commit()
        else:
            self.db_session.flush()

    @staticmethod
    def _check_immutable_fields(services_component: ServicesComponent, updated_fields: dict[str, Any]) -> None:
        if "id" in updated_fields and services_component.id != updated_fields.get("id"):
            raise ValidationError({"id": ["ID cannot be changed"]})

        if "agreement_id" in updated_fields and services_component.agreement_id != updated_fields.get("agreement_id"):
            raise ValidationError({"agreement_id": ["Agreement ID cannot be changed"]})

    def _awarded_tracked_changes(
        self, services_component: ServicesComponent, updated_fields: dict[str, Any]
    ) -> dict[str, tuple[Any, Any]]:
        """On an Awarded, tracked agreement (non-superuser): reject a change to the SC's number,
        Optional flag or sub-component, and return its period-of-performance changes as
        ``{field: (old, new)}`` to record as Modified LOE edits (OPS-3268). Empty otherwise.
        A period change is rejected for every user while the SC's edits are in review."""

        def changed(field):
            return field in updated_fields and updated_fields[field] != getattr(services_component, field)

        tracked_changes = {
            field: (getattr(services_component, field), updated_fields[field])
            for field in SERVICES_COMPONENT_TRACKED_FIELDS
            if changed(field)
        }
        # Locked for every user, superusers too, like the other in-review locks: the edits are
        # what the Division Director is reviewing.
        if tracked_changes and ContractModificationEditService(
            self.db_session
        ).services_component_in_review_modification(services_component.id):
            raise ValidationError({"services_component": [SC_IN_REVIEW_MODIFICATION_MESSAGE]})

        if not sc_requires_approval_gate(services_component.agreement):
            return {}
        locked = [field for field in AWARDED_LOCKED_FIELDS if changed(field)]
        if locked:
            raise ValidationError({field: [AWARDED_LOCKED_MESSAGE] for field in locked})
        return tracked_changes

    @staticmethod
    def _check_not_in_review(services_component: ServicesComponent) -> None:
        if services_component.in_review:
            raise ValidationError({"services_component": [IN_REVIEW_MESSAGE]})

    def _check_not_in_review_modification(self, obj_id: int) -> None:
        """Block deleting an SC whose linked budget lines are in a contract modification that is
        in review (OPS-3268): deleting the SC would null their ``services_component_id``,
        silently changing what the Division Director is reviewing or has already approved to
        execute."""
        budget_line_item_ids = self.db_session.scalars(
            select(BudgetLineItem.id).where(BudgetLineItem.services_component_id == obj_id)
        ).all()
        if ContractModificationEditService(self.db_session).budget_line_ids_in_review_modification(
            list(budget_line_item_ids)
        ):
            raise ValidationError({"services_component": [BLI_IN_REVIEW_MODIFICATION_MESSAGE]})
        if ContractModificationEditService(self.db_session).services_component_in_review_modification(obj_id):
            raise ValidationError({"services_component": [SC_IN_REVIEW_MODIFICATION_MESSAGE]})

    def _check_no_executing_budget_lines(self, obj_id: int) -> None:
        """Block deleting an SC with Executing or Obligated budget lines: the FK is
        ``ON DELETE SET NULL``, so the delete would silently unlink lines that are on (or going
        onto) the contract, with no history (OPS-3268). Applies to every user, superusers too."""
        has_executing = self.db_session.scalar(
            select(BudgetLineItem.id)
            .where(
                BudgetLineItem.services_component_id == obj_id,
                BudgetLineItem.status.in_([BudgetLineItemStatus.IN_EXECUTION, BudgetLineItemStatus.OBLIGATED]),
            )
            .limit(1)
        )
        if has_executing is not None:
            raise ValidationError({"services_component": [HAS_EXECUTING_BUDGET_LINES_MESSAGE]})

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
