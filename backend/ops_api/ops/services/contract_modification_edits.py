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
from ops_api.ops.utils.budget_line_items_helpers import agreement_tracks_contract_modifications

SC_ADDITION_IN_MODIFICATION_MESSAGE = (
    "This Services Component's addition is in a contract modification that is in review, "
    "so it can't be deleted until the modification is approved or declined."
)
COR_CHANGE_IN_MODIFICATION_MESSAGE = (
    "The COR change is in a contract modification that is in review, "
    "so the COR can't be changed until the modification is approved or declined."
)


def tracks_cor_changes(agreement: Agreement) -> bool:
    """Whether a COR change on this agreement is tracked as an "Edit That Requires a Contract
    Modification" (OPS-3153): an Awarded Contract or AA agreement with ENABLE_MODIFIED_LOE_EDITS on.
    Shared by the save path and the agreement's lock message, so the two can't drift apart."""
    return agreement.agreement_type in _SUPPORTED_AGREEMENT_TYPES and agreement_tracks_contract_modifications(agreement)


SC_IN_REVIEW_MODIFICATION_MESSAGE = (
    "This Services Component has edits in a contract modification that is in review, so it can't be "
    "changed until the modification is approved or declined."
)

# Services Component fields whose direct edits on an Awarded agreement are tracked as Modified LOE
# edits (OPS-3268): its period of performance, one card per field (PoP-Start / PoP-End).
SERVICES_COMPONENT_TRACKED_FIELDS = ("period_start", "period_end")

BLI_IN_REVIEW_MODIFICATION_MESSAGE = (
    "This budget line is in a contract modification that is in review, so it can't be changed "
    "until the modification is approved or declined."
)


def _iso_or_none(value):
    """A date as the ISO string stored in old_value/new_value (JSON); other values unchanged."""
    return value.isoformat() if hasattr(value, "isoformat") else value


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
        budget_line_item_id = getattr(change_request, "budget_line_item_id", None)
        old_value, new_value = diff.get("old"), diff.get("new")

        if budget_line_item_id is not None:
            old_value = self._merge_with_pending_for_budget_line(budget_line_item_id, field, old_value)
            if field != "delete" and old_value == new_value:
                return None

        edit = ContractModificationEdit(
            agreement_id=change_request.agreement_id,
            modification_type=ModificationEditType.MODIFIED_LOE,
            change_request_id=change_request.id,
            budget_line_item_id=budget_line_item_id,
            services_component_id=getattr(change_request, "services_component_id", None),
            field=field,
            old_value=old_value,
            new_value=new_value,
            requested_by_id=change_request.created_by,
            requested_on=change_request.created_on,
            approved_by_id=change_request.reviewed_by_id,
            approved_on=change_request.reviewed_on,
        )
        self.db_session.add(edit)
        try:
            self.db_session.flush()
        except IntegrityError:
            # A concurrent save on the same field won. The caller rolls back the session.
            raise ValidationError(
                {field: ["Another change to this field was saved at the same time. Refresh and try again."]}
            ) from None
        return edit

    def _merge_with_pending_for_budget_line(self, budget_line_item_id: int, field: str, old_value):
        """Remove the line's pending edits that a new edit to ``field`` replaces, and return the
        new edit's From: the oldest pending From (the awarded value), the same as
        ``record_direct_edit`` / ``record_direct_delete``. Otherwise inserting the new edit trips
        ``ix_contract_modification_edit_one_pending_bli_field``. A delete replaces all of them."""
        is_delete = field == "delete"
        pending = self._pending_for_budget_line(budget_line_item_id, None if is_delete else field)
        if not pending:
            return old_value
        if is_delete:
            old_value = next((edit.old_value for edit in pending if edit.field == "amount"), old_value)
        else:
            old_value = pending[0].old_value
        for edit in pending:
            self.db_session.delete(edit)
        # Flush the deletes first so the INSERT doesn't trip the unique index.
        self.db_session.flush()
        return old_value

    def record_direct_edit(self, budget_line_item, field: str, old_value, new_value, user_id: int) -> None:
        """Record an edit applied directly on an Awarded agreement, with no change request.

        Merges with the budget line's pending edits to the same field, so the card shows the
        awarded value as From and the latest value as To, and drops the edit when the change nets
        to nothing (so a modification never carries an edit the list doesn't show). ``old_value``
        and ``new_value`` must be in the format change requests snapshot
        (``PATCHRequestBodySchema(only=[field]).dump``). Flushes (but does not commit) so a
        concurrent duplicate save (double-click/retry) fails fast on
        ``ix_contract_modification_edit_one_pending_bli_field`` instead of silently orphaning a
        pending row.
        """
        pending = self._pending_for_budget_line(budget_line_item.id, field)
        if pending:
            old_value = pending[0].old_value
            for edit in pending:
                self.db_session.delete(edit)
            # Flush the delete(s) first: SQLAlchemy's unit of work otherwise flushes the new
            # row's INSERT before these DELETEs, tripping the unique index on a merge that is
            # actually fine (the row below replaces the one just deleted).
            self.db_session.flush()
        if old_value == new_value:
            return
        self._add_direct_edit(
            budget_line_item.agreement_id, budget_line_item.id, None, field, old_value, new_value, user_id
        )
        try:
            self.db_session.flush()
        except IntegrityError:
            # ix_contract_modification_edit_one_pending_bli_field: a concurrent save on the same
            # field won. The caller rolls back the session.
            raise ValidationError(
                {field: ["Another change to this field was saved at the same time. Refresh and try again."]}
            ) from None

    def record_direct_delete(self, budget_line_item, old_amount, user_id: int) -> None:
        """Record a budget line deleted directly on an Awarded agreement. Call before the delete.

        A budget line that only went Draft -> Planned after the award was never on the contract, so
        its pending edits are dropped and no delete is recorded. Otherwise the line's other pending
        edits are replaced by the delete, whose From is the awarded amount. Flushes (but does not
        commit) so a concurrent duplicate delete (double-click/retry) fails fast on
        ``ix_contract_modification_edit_one_pending_bli_field`` instead of surfacing as an
        unhandled 500, the same as ``record_direct_edit``.
        """
        pending = self._pending_for_budget_line(budget_line_item.id)
        for edit in pending:
            self.db_session.delete(edit)
        if any(edit.field == "status" and edit.old_value == "DRAFT" for edit in pending):
            return
        if pending:
            # Flush the deletes first: the unit of work otherwise flushes the new row's INSERT
            # before these DELETEs, tripping the unique index on a merge that is actually fine.
            self.db_session.flush()
        awarded_amount = next((edit.old_value for edit in pending if edit.field == "amount"), old_amount)
        self._add_direct_edit(
            budget_line_item.agreement_id, budget_line_item.id, None, "delete", awarded_amount, "Deleted", user_id
        )
        try:
            self.db_session.flush()
        except IntegrityError:
            # ix_contract_modification_edit_one_pending_bli_field: a concurrent delete won.
            # The caller rolls back the session.
            raise ValidationError(
                {
                    "budget_line_item": [
                        "Another change to this budget line was saved at the same time. Refresh and try again."
                    ]
                }
            ) from None

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

    def record_services_component_edit(
        self, services_component: ServicesComponent, field: str, old_value, new_value, user_id: int
    ) -> None:
        """Record a Services Component period-of-performance edit applied directly on an Awarded
        agreement (OPS-3268). Dates are stored as ISO strings.

        Merges with the SC's pending edit to the same field and drops the edit when it nets to
        nothing, the same as ``record_direct_edit``. An SC added after the award (still carrying
        its pending "Add SC" edit) was never on the contract, so nothing is recorded. Flushes (but
        does not commit) so a concurrent duplicate save fails fast on
        ``ix_contract_modification_edit_one_pending_sc_field``.
        """
        if self._pending_services_component_additions(services_component.id):
            return
        old_value, new_value = _iso_or_none(old_value), _iso_or_none(new_value)
        pending = self._pending_for_services_component(services_component.id, field)
        if pending:
            old_value = pending[0].old_value
            for edit in pending:
                self.db_session.delete(edit)
            # Flush the delete(s) first so the INSERT below doesn't trip the unique index.
            self.db_session.flush()
        if old_value == new_value:
            return
        self._add_direct_edit(
            services_component.agreement_id, None, services_component.id, field, old_value, new_value, user_id
        )
        try:
            self.db_session.flush()
        except IntegrityError:
            # ix_contract_modification_edit_one_pending_sc_field: a concurrent save on the same
            # field won. The caller rolls back the session.
            raise ValidationError(
                {field: ["Another change to this field was saved at the same time. Refresh and try again."]}
            ) from None

    def services_component_in_review_modification(self, services_component_id: int) -> bool:
        """Whether any of the SC's edits are in a contract modification request that is in review.
        They are what the Division Director is reviewing, so the SC can't be changed until the
        request is approved or declined."""
        if not current_app.config.get("ENABLE_MODIFIED_LOE_EDITS", False):
            return False
        return (
            self.db_session.scalar(
                select(ContractModificationRequest.id)
                .join(ContractModificationRequest.edits)
                .where(
                    ContractModificationEdit.services_component_id == services_component_id,
                    ContractModificationEdit.budget_line_item_id.is_(None),
                    ContractModificationRequest.status == ContractModificationRequestStatus.IN_REVIEW,
                )
                .limit(1)
            )
            is not None
        )

    def record_services_component_delete(self, services_component: ServicesComponent, user_id: int) -> None:
        """Record a Services Component deleted directly on an Awarded agreement. Call before the
        delete. If the SC still has a pending "Add SC" edit, it was added after the award and never
        made it onto the contract, so the add is discarded and nothing is recorded (net zero, like
        a budget line made Planned only after the award). The SC's pending period-of-performance
        edits are replaced by the delete. Does not commit."""
        if self.discard_pending_services_component_addition(services_component.id):
            return
        self.discard_pending_services_component_edits(services_component.id)
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

    def _pending_for_services_component(self, services_component_id: int, field: Optional[str] = None):
        """The SC's own pending edits (optionally to one field), oldest first."""
        query = select(ContractModificationEdit).where(
            ContractModificationEdit.services_component_id == services_component_id,
            ContractModificationEdit.budget_line_item_id.is_(None),
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

    def discard_pending_services_component_addition(self, services_component_id: int) -> bool:
        """Remove the pending "Add SC" edit of a Services Component being deleted (OPS-6440).

        Otherwise the edit stays pending and goes into the next modification for an SC that no
        longer exists. If the edit is in a contract modification in review, removing it would
        change what the Division Director is reviewing, so the delete is rejected instead.
        Does not commit. Returns whether a pending "Add SC" edit was found and discarded.
        """
        edits = self._pending_services_component_additions(services_component_id)
        if not edits:
            return False
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
        # Its period-of-performance edits (if any) go with it: the SC was never on the contract.
        self.discard_pending_services_component_edits(services_component_id)
        return True

    def discard_pending_services_component_edits(self, services_component_id: int) -> None:
        """Remove the SC's pending period-of-performance edits, e.g. when it is deleted: they'd
        otherwise go into the next modification for an SC that no longer exists. Does not commit."""
        for edit in self._pending_for_services_component(services_component_id):
            if edit.field in SERVICES_COMPONENT_TRACKED_FIELDS:
                self.db_session.delete(edit)

    def _pending_services_component_additions(self, services_component_id: int) -> list[ContractModificationEdit]:
        """The SC's pending "Add SC" edits: set when it was added after the award."""
        return list(
            self.db_session.scalars(
                select(ContractModificationEdit).where(
                    ContractModificationEdit.services_component_id == services_component_id,
                    ContractModificationEdit.field == ServicesComponentChangeRequest.create_field_name,
                    ContractModificationEdit.agreement_mod_id.is_(None),
                )
            ).all()
        )

    def record_project_officer_change(
        self,
        agreement: Agreement,
        old_project_officer_id: Optional[int],
        new_project_officer_id: int,
        user: User,
        cleared_alternate_project_officer_id: Optional[int] = None,
    ) -> None:
        """Track a COR change on an Awarded agreement as an ADMIN_CHANGE edit (OPS-3153, #3269).

        The COR change itself is applied by the caller; this records that the contract still
        needs a modification for it. There is one card per agreement showing the net change, from
        the COR on the contract to the current COR: a further change updates its To, and changing
        back to the COR on the contract removes it. ``cleared_alternate_project_officer_id`` is the
        Alternate COR this save cleared by promoting it; the card keeps the first one, so declining
        the modification can put it back (``revert_project_officer_change``). Does not commit.

        A card in a modification that is in review is never changed here: the COR is locked
        until the modification is approved or declined (``check_project_officer_change_not_in_review``).
        """
        pending = self._pending_project_officer_edit(agreement.id)
        if pending is not None:
            if pending.old_value == new_project_officer_id:
                self.db_session.delete(pending)
                self.db_session.flush()
                return
            pending.new_value = new_project_officer_id
            pending.requested_by_id = user.id
            pending.requested_on = func.now()
            if pending.cleared_alternate_project_officer_id is None:
                pending.cleared_alternate_project_officer_id = cleared_alternate_project_officer_id
            self.db_session.flush()
            return

        edit = ContractModificationEdit(
            agreement_id=agreement.id,
            modification_type=ModificationEditType.ADMIN_CHANGE,
            field=PROJECT_OFFICER_EDIT_FIELD,
            old_value=old_project_officer_id,
            new_value=new_project_officer_id,
            requested_by_id=user.id,
            requested_on=func.now(),
            cleared_alternate_project_officer_id=cleared_alternate_project_officer_id,
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

    def alternate_to_restore_on_change_back(
        self, agreement_id: int, new_project_officer_id: Optional[int]
    ) -> Optional[int]:
        """The Alternate COR to put back when a save changes the COR back to the COR on the contract.

        Changing back removes the agreement's pending COR card (``record_project_officer_change``).
        If the change cleared the Alternate COR by promoting it, it's restored, as a decline does
        (``revert_project_officer_change``). Returns None when there's nothing to restore.
        """
        pending = self._pending_project_officer_edit(agreement_id)
        if pending is None or pending.old_value != new_project_officer_id:
            return None
        return pending.cleared_alternate_project_officer_id

    def revert_project_officer_change(self, agreement: Agreement, edit: ContractModificationEdit) -> dict:
        """Undo a COR change whose contract modification was declined (#3269), and remove its card.

        The COR goes back to the card's From, the COR on the contract. If saving the change cleared
        the Alternate COR (a promotion), it's restored, unless someone has picked a new Alternate
        COR since. If the restored COR is the current Alternate COR, the Alternate COR is cleared,
        so one person isn't both. Returns what changed, for the review event's history:
        ``{"from", "to", "alternate_from", "alternate_to"}``. Does not commit.
        """
        # Agreement first, then the card: the same lock order as a COR save.
        self.db_session.refresh(agreement, with_for_update={"key_share": True})
        reverted_from = agreement.project_officer_id
        alternate_from = agreement.alternate_project_officer_id
        agreement.project_officer_id = edit.old_value
        if alternate_from is None and edit.cleared_alternate_project_officer_id is not None:
            agreement.alternate_project_officer_id = edit.cleared_alternate_project_officer_id
        elif alternate_from is not None and alternate_from == edit.old_value:
            agreement.alternate_project_officer_id = None
        self.db_session.delete(edit)
        return {
            "from": reverted_from,
            "to": edit.old_value,
            "alternate_from": alternate_from,
            "alternate_to": agreement.alternate_project_officer_id,
        }

    def project_officer_locked_message(self, agreement_id: int) -> Optional[str]:
        """Why the COR can't be changed right now, or None (#3269): the pending COR change is in
        a contract modification in review, and changing it would change what the Division
        Director is reviewing."""
        in_review_request_id = self.db_session.scalar(
            select(ContractModificationRequest.id)
            .join(ContractModificationRequest.edits)
            .where(
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.modification_type == ModificationEditType.ADMIN_CHANGE,
                ContractModificationEdit.field == PROJECT_OFFICER_EDIT_FIELD,
                ContractModificationEdit.agreement_mod_id.is_(None),
                ContractModificationRequest.status == ContractModificationRequestStatus.IN_REVIEW,
            )
            .limit(1)
        )
        return COR_CHANGE_IN_MODIFICATION_MESSAGE if in_review_request_id is not None else None

    def check_project_officer_change_not_in_review(self, agreement_id: int) -> None:
        """Reject a COR change while :meth:`project_officer_locked_message` says it's locked.

        Locks the pending COR card first, when there is one. Sending a contract modification to
        approval locks the same row, so a save and a send are serialized: the save sees the card
        in review once the send has committed, rather than changing it under the Division Director.
        With no card yet there is nothing to lock or change; a new card just waits for the next
        modification.
        """
        self._pending_project_officer_edit(agreement_id)
        message = self.project_officer_locked_message(agreement_id)
        if message:
            raise ValidationError({"project_officer_id": [message]})

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
