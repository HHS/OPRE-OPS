"""Service for "Edits That Require a Contract Modification" on the Award & Modifications tab.

Once an Agreement is Awarded, an approved money/time edit made in OPS (a "Modified Level of
Effort") still has to be carried into the actual contract via a Contract Modification. Each
such approved edit is recorded as a ``ContractModificationEdit`` and stays pending until the
user's contract modification request is approved (OPS-3072, AC9; see contract_modification_requests.py, #3268).
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
    ChangeRequestStatus,
    ChangeRequestType,
    ContractModificationEdit,
    ContractModificationRequest,
    ContractModificationRequestStatus,
    ModificationEditType,
    ServicesComponentChangeRequest,
    User,
)
from ops_api.ops.services.agreement_award_history import _SUPPORTED_AGREEMENT_TYPES
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError

SC_ADDITION_IN_MODIFICATION_MESSAGE = (
    "This Services Component's addition is in a contract modification that is in review, "
    "so it can't be deleted until the modification is approved or declined."
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
        # Component request carries "services_component_create" or "services_component_delete".
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

    def has_pending_services_component_addition(self, services_component_id: int) -> bool:
        """Whether the SC's addition was approved but isn't in a started modification yet (OPS-6440)."""
        query = self._pending_services_component_addition_query(services_component_id).limit(1)
        return self.db_session.scalar(query) is not None

    @staticmethod
    def _pending_services_component_addition_query(services_component_id: int):
        return select(ContractModificationEdit).where(
            ContractModificationEdit.services_component_id == services_component_id,
            ContractModificationEdit.field == ServicesComponentChangeRequest.create_field_name,
            ContractModificationEdit.agreement_mod_id.is_(None),
        )

    def discard_pending_services_component_addition(self, services_component_id: int) -> None:
        """Remove the pending "Add SC" edit of a Services Component being deleted (OPS-6440).

        Otherwise the edit stays pending and goes into the next modification for an SC that no
        longer exists. If the edit is in a contract modification in review, removing it would
        change what the Division Director is reviewing, so the delete is rejected instead.
        Does not commit.
        """
        edits = self.db_session.scalars(self._pending_services_component_addition_query(services_component_id)).all()
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
