"""Service for "Edits That Require a Contract Modification" on the Award & Modifications tab.

Once an Agreement is Awarded, a money/time edit made in OPS (a "Modified Level of Effort") still
has to be carried into the actual contract via a Contract Modification. Most edits (budget line
amount/CAN/Obligate By, Draft -> Planned, delete, Services Component add/delete) apply directly
when saved and are recorded here with no approver (OPS-3072/OPS-3268: DD approval is needed only
to execute a Planned budget line, via contract_modification_requests.py). A legacy change request
approved before that change shipped is still recorded on approval.
"""

from typing import Optional

from flask import current_app
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from models import (
    PROJECT_OFFICER_EDIT_FIELD,
    Agreement,
    AgreementMod,
    BudgetLineItem,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractModificationEdit,
    ContractModificationRequest,
    ContractModificationRequestStatus,
    ModificationEditType,
    ServicesComponent,
    ServicesComponentChangeRequest,
    User,
)
from ops_api.ops.services.agreement_award_history import _SUPPORTED_AGREEMENT_TYPES
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError

SC_ADDITION_IN_MODIFICATION_MESSAGE = (
    "This Services Component's addition is in a contract modification that is in review, "
    "so it can't be deleted until the modification is approved or declined."
)

BLI_IN_REVIEW_MODIFICATION_MESSAGE = (
    "This budget line is in a contract modification that is in review, so it can't be changed "
    "until the modification is approved or declined."
)


class ContractModificationEditService:
    def __init__(self, db_session=None):
        self.db_session = db_session or current_app.db_session

    def create_from_approved_change_request(self, change_request) -> Optional[ContractModificationEdit]:
        """Record an approved change request that requires a contract modification.

        Adds the row to the session without committing, so it commits (or rolls back)
        together with the change request approval. Must be called before an approved
        delete removes the budget line (and, by cascade, the change request).

        Returns None when the change request doesn't qualify.
        """
        if not current_app.config.get("ENABLE_MODIFIED_LOE_EDITS", False):
            return None
        if change_request.change_request_type not in (
            ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST,
        ):
            return None
        if change_request.status != ChangeRequestStatus.APPROVED:
            return None
        # The snapshot already excludes status changes other than Draft->Planned.
        if not change_request.requires_contract_modification:
            return None

        # Each budget line change request carries exactly one field (add_bli_change_requests
        # creates one per field; a delete request carries the "delete" sentinel). A Services
        # Component request carries "services_component_create".
        field = next(iter(change_request.requested_change_data))
        diff = (change_request.requested_change_diff or {}).get(field, {})

        edit = ContractModificationEdit(
            agreement_id=change_request.agreement_id,
            modification_type=ModificationEditType.MODIFIED_LOE,
            change_request_id=change_request.id,
            budget_line_item_id=getattr(change_request, "budget_line_item_id", None),
            services_component_id=getattr(change_request, "services_component_id", None),
            field=field,
            old_value=diff.get("old"),
            new_value=diff.get("new"),
            requested_by_id=change_request.created_by,
            requested_on=change_request.created_on,
            approved_by_id=change_request.reviewed_by_id,
            approved_on=change_request.reviewed_on,
        )
        self.db_session.add(edit)
        return edit

    def record_direct_edit(self, budget_line_item, field: str, old_value, new_value, user_id: int) -> None:
        """Record an edit applied directly on an Awarded agreement, with no change request.

        Merges with the budget line's pending edits to the same field, so the card shows the
        awarded value as From and the latest value as To, and drops the edit when the change nets
        to nothing (so a modification never carries an edit the list doesn't show). ``old_value``
        and ``new_value`` must be in the format change requests snapshot
        (``PATCHRequestBodySchema(only=[field]).dump``). Does not commit.
        """
        pending = self._pending_for_budget_line(budget_line_item.id, field)
        if pending:
            old_value = pending[0].old_value
            for edit in pending:
                self.db_session.delete(edit)
        if old_value == new_value:
            return
        self._add_direct_edit(
            budget_line_item.agreement_id, budget_line_item.id, None, field, old_value, new_value, user_id
        )

    def record_direct_delete(self, budget_line_item, old_amount, user_id: int) -> None:
        """Record a budget line deleted directly on an Awarded agreement. Call before the delete.

        A budget line that only went Draft -> Planned after the award was never on the contract, so
        its pending edits are dropped and no delete is recorded. Otherwise the line's other pending
        edits are replaced by the delete, whose From is the awarded amount. Does not commit.
        """
        pending = self._pending_for_budget_line(budget_line_item.id)
        for edit in pending:
            self.db_session.delete(edit)
        if any(edit.field == "status" and edit.old_value == "DRAFT" for edit in pending):
            return
        awarded_amount = next((edit.old_value for edit in pending if edit.field == "amount"), old_amount)
        self._add_direct_edit(
            budget_line_item.agreement_id, budget_line_item.id, None, "delete", awarded_amount, "Deleted", user_id
        )

    def record_services_component_add(self, services_component: ServicesComponent, user_id: int) -> None:
        """Record a Services Component added directly on an Awarded agreement. Does not commit."""
        self._add_direct_edit(
            services_component.agreement_id,
            None,
            services_component.id,
            ServicesComponentChangeRequest.create_field_name,
            None,
            services_component.display_name,
            user_id,
        )

    def record_services_component_delete(self, services_component: ServicesComponent, user_id: int) -> None:
        """Record a Services Component deleted directly on an Awarded agreement. Call before the
        delete. Discards any still-pending "Add SC" edit for it first. Does not commit."""
        self.discard_pending_services_component_addition(services_component.id)
        self._add_direct_edit(
            services_component.agreement_id,
            None,
            services_component.id,
            "delete",
            services_component.display_name,
            "Deleted",
            user_id,
        )

    def _add_direct_edit(
        self,
        agreement_id: int,
        budget_line_item_id: Optional[int],
        services_component_id: Optional[int],
        field: str,
        old_value,
        new_value,
        user_id: int,
    ) -> None:
        self.db_session.add(
            ContractModificationEdit(
                agreement_id=agreement_id,
                modification_type=ModificationEditType.MODIFIED_LOE,
                budget_line_item_id=budget_line_item_id,
                services_component_id=services_component_id,
                field=field,
                old_value=old_value,
                new_value=new_value,
                requested_by_id=user_id,
                requested_on=func.now(),
                # Set here: rows flushed inside the edit bundle leave session.new before the
                # created_by hook (handle_create_update_by_attrs) runs at commit.
                created_by=user_id,
            )
        )

    def _pending_for_budget_line(self, budget_line_item_id: int, field: Optional[str] = None):
        """The budget line's pending edits (optionally to one field), oldest first."""
        query = select(ContractModificationEdit).where(
            ContractModificationEdit.budget_line_item_id == budget_line_item_id,
            ContractModificationEdit.services_component_id.is_(None),
            ContractModificationEdit.agreement_mod_id.is_(None),
        )
        if field is not None:
            query = query.where(ContractModificationEdit.field == field)
        return list(
            self.db_session.scalars(
                query.order_by(ContractModificationEdit.requested_on, ContractModificationEdit.id)
            ).all()
        )

    def budget_line_in_review_modification(self, budget_line_item_id: int) -> bool:
        """Whether the budget line is selected to execute in, or has edits in, a contract
        modification request that is in review. Its edits and selection are what the Division
        Director is reviewing, so it can't be changed until the request is approved or declined."""
        return budget_line_item_id in self.budget_line_ids_in_review_modification([budget_line_item_id])

    def budget_line_ids_in_review_modification(self, budget_line_item_ids: list[int]) -> set[int]:
        """The given budget lines that are in a contract modification request in review (see
        ``budget_line_in_review_modification``), in two queries whatever the number of lines."""
        if not budget_line_item_ids or not current_app.config.get("ENABLE_MODIFIED_LOE_EDITS", False):
            return set()
        selected = self.db_session.scalars(
            select(BudgetLineItem.id)
            .select_from(ContractModificationRequest)
            .join(ContractModificationRequest.budget_line_items)
            .where(
                BudgetLineItem.id.in_(budget_line_item_ids),
                ContractModificationRequest.status == ContractModificationRequestStatus.IN_REVIEW,
            )
        ).all()
        with_edits = self.db_session.scalars(
            select(ContractModificationEdit.budget_line_item_id)
            .select_from(ContractModificationRequest)
            .join(ContractModificationRequest.edits)
            .where(
                ContractModificationEdit.budget_line_item_id.in_(budget_line_item_ids),
                ContractModificationEdit.services_component_id.is_(None),
                ContractModificationRequest.status == ContractModificationRequestStatus.IN_REVIEW,
            )
        ).all()
        return set(selected) | set(with_edits)

    def get_pending_for_agreement(self, agreement_id: int) -> list[ContractModificationEdit]:
        """Return the agreement's edits not yet attached to a started modification, oldest first.

        Only the latest edit per (budget line, field) is returned, since the budget line's current
        value is what goes into the modification; a deleted budget line shows only its delete.
        Superseded rows are kept and still attach to the modification when it starts.
        """
        self._get_supported_agreement(agreement_id)
        pending = self.db_session.scalars(self._pending_query(agreement_id)).all()
        return self._latest_per_budget_line_field(pending)

    @staticmethod
    def _latest_per_budget_line_field(edits) -> list[ContractModificationEdit]:
        """Collapse oldest-first edits to the latest per (budget line, field), keeping list order."""
        latest = {}
        deleted = set()
        for edit in edits:
            # Services Component rows have no budget line, so they're keyed by SC instead;
            # otherwise two SC adds would collapse into one (OPS-6440).
            if edit.services_component_id is not None:
                target = ("sc", edit.services_component_id)
            elif edit.budget_line_item_id is None:
                # Agreement-level edits, e.g. a COR change (OPS-3153)
                target = ("agreement", edit.agreement_id)
            else:
                target = ("bli", edit.budget_line_item_id)
            if edit.field == "delete":
                deleted.add(target)
            key = (target, edit.field)
            # re-insert so the edit sorts by its latest occurrence
            latest.pop(key, None)
            latest[key] = edit
        return [edit for (target, field), edit in latest.items() if not (target in deleted and field != "delete")]

    def attach_pending_edits_to_mod(self, agreement_id: int, agreement_mod_id: int, edit_ids: list[int]) -> int:
        """Attach the given pending edits on the agreement to the given modification.

        Only ``edit_ids`` are attached, so an edit approved after the caller read the pending
        list isn't swept into the modification without being reported. Does not commit.
        Returns the number of edits attached.
        """
        agreement_mod = self.db_session.get(AgreementMod, agreement_mod_id)
        if agreement_mod is None:
            raise ResourceNotFoundError("AgreementMod", agreement_mod_id)
        if agreement_mod.agreement_id != agreement_id:
            raise ValidationError({"agreement_mod_id": "The modification does not belong to this agreement."})

        result = self.db_session.execute(
            update(ContractModificationEdit)
            .where(
                ContractModificationEdit.id.in_(edit_ids),
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.agreement_mod_id.is_(None),
            )
            .values(agreement_mod_id=agreement_mod_id)
            .execution_options(synchronize_session="fetch")
        )
        return result.rowcount

    def discard_pending_services_component_addition(self, services_component_id: int) -> None:
        """Remove the pending "Add SC" edit of a Services Component being deleted (OPS-6440).

        Otherwise the edit stays pending and goes into the next modification for an SC that no
        longer exists. If the edit is in a contract modification in review, removing it would
        change what the Division Director is reviewing, so the delete is rejected instead.
        Does not commit.
        """
        edits = self.db_session.scalars(
            select(ContractModificationEdit).where(
                ContractModificationEdit.services_component_id == services_component_id,
                ContractModificationEdit.field == ServicesComponentChangeRequest.create_field_name,
                ContractModificationEdit.agreement_mod_id.is_(None),
            )
        ).all()
        if not edits:
            return
        in_review_request_id = self.db_session.scalar(
            select(ContractModificationRequest.id)
            .join(ContractModificationRequest.edits)
            .where(
                ContractModificationEdit.id.in_([edit.id for edit in edits]),
                ContractModificationRequest.status == ContractModificationRequestStatus.IN_REVIEW,
            )
            .limit(1)
        )
        if in_review_request_id is not None:
            raise ValidationError({"services_component": [SC_ADDITION_IN_MODIFICATION_MESSAGE]})
        for edit in edits:
            self.db_session.delete(edit)

    def record_project_officer_change(
        self, agreement: Agreement, new_project_officer_id: Optional[int], user: User
    ) -> Optional[ContractModificationEdit]:
        """Record a COR change on an Awarded agreement as a pending ADMIN_CHANGE edit (OPS-3153).

        The agreement's COR is not changed: it keeps its current value until the contract
        modification is approved. There is at most one pending COR change per agreement, so a
        new target replaces the pending one. Returns the recorded edit, or None when the target
        is already pending (nothing changed). Does not commit.
        """
        pending = self._pending_project_officer_edit(agreement.id)
        if pending is not None:
            if pending.new_value == new_project_officer_id:
                return None
            pending.new_value = new_project_officer_id
            pending.requested_by_id = user.id
            pending.requested_on = func.now()
            self.db_session.flush()
            return pending

        edit = ContractModificationEdit(
            agreement_id=agreement.id,
            modification_type=ModificationEditType.ADMIN_CHANGE,
            field=PROJECT_OFFICER_EDIT_FIELD,
            old_value=agreement.project_officer_id,
            new_value=new_project_officer_id,
            requested_by_id=user.id,
            requested_on=func.now(),
        )
        self.db_session.add(edit)
        try:
            self.db_session.flush()
        except IntegrityError:
            # ix_contract_modification_edit_one_pending_cor_change: a concurrent save won.
            # The caller rolls back the session.
            raise ValidationError(
                {"project_officer_id": ["Another COR change was saved at the same time. Refresh and try again."]}
            ) from None
        return edit

    def sync_pending_project_officer_change(self, agreement: Agreement) -> None:
        """Keep the pending COR change in step after the COR was changed directly (OPS-3153).

        Promoting the Alternate COR applies immediately. The pending change stays and now goes
        from the new COR; if the new COR is the pending target, nothing is left to change and the
        pending edit is removed. Does not commit.
        """
        pending = self._pending_project_officer_edit(agreement.id)
        if pending is None:
            return
        if pending.new_value == agreement.project_officer_id:
            self.db_session.delete(pending)
        else:
            pending.old_value = agreement.project_officer_id
        self.db_session.flush()

    def _pending_project_officer_edit(self, agreement_id: int) -> Optional[ContractModificationEdit]:
        """The agreement's pending COR change, locked for update."""
        query = (
            select(ContractModificationEdit)
            .where(
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.modification_type == ModificationEditType.ADMIN_CHANGE,
                ContractModificationEdit.field == PROJECT_OFFICER_EDIT_FIELD,
                ContractModificationEdit.agreement_mod_id.is_(None),
            )
            .with_for_update()
        )
        return self.db_session.scalars(query).first()

    def _get_supported_agreement(self, agreement_id: int) -> Agreement:
        agreement = self.db_session.get(Agreement, agreement_id)
        if agreement is None:
            raise ResourceNotFoundError("Agreement", agreement_id)
        if agreement.agreement_type not in _SUPPORTED_AGREEMENT_TYPES:
            raise ValidationError(
                {"agreement_type": "Contract modifications are only available for Contract and AA agreements."}
            )
        return agreement

    @staticmethod
    def _pending_query(agreement_id: int):
        return (
            select(ContractModificationEdit)
            .options(selectinload(ContractModificationEdit.requested_by))
            .where(
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.agreement_mod_id.is_(None),
            )
            .order_by(ContractModificationEdit.requested_on, ContractModificationEdit.id)
        )
