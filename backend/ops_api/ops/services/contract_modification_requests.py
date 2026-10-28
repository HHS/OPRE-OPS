"""Contract Modification requests on Awarded agreements (#3268).

The user bundles the agreement's pending "Edits That Require a Contract Modification" with any
Planned budget lines they want to execute, and sends them to the Division Director. Approval
creates the ``AgreementMod``, attaches the edits to it and executes the budget lines; a decline
leaves the edits pending. Only one request per agreement can be in review at a time.
"""

from datetime import datetime, timezone
from typing import Optional

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from models import (
    AgreementMod,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractModificationRequest,
    ContractModificationRequestNotification,
    ContractModificationRequestStatus,
    ModType,
    NotificationType,
)
from models.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
from ops_api.ops.services.notifications import NotificationService
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.agreements_helpers import check_user_association, get_division_directors_for_agreement

APPROVE = "APPROVE"
DECLINE = "DECLINE"
_ALREADY_IN_REVIEW = "A contract modification is already in review for this agreement."


class ContractModificationRequestService:
    def __init__(self, db_session=None):
        self.db_session = db_session or current_app.db_session
        self._edit_service = ContractModificationEditService(self.db_session)
        self._notification_service = NotificationService(self.db_session)

    def get_for_agreement(self, agreement_id: int) -> list[ContractModificationRequest]:
        """Return the agreement's contract modification requests, newest first."""
        self._edit_service._get_supported_agreement(agreement_id)
        return list(
            self.db_session.scalars(
                select(ContractModificationRequest)
                .options(
                    selectinload(ContractModificationRequest.edits),
                    selectinload(ContractModificationRequest.budget_line_items),
                )
                .where(ContractModificationRequest.agreement_id == agreement_id)
                .order_by(ContractModificationRequest.created_on.desc(), ContractModificationRequest.id.desc())
            ).all()
        )

    def get_in_review(self, agreement_id: int) -> Optional[ContractModificationRequest]:
        return self.db_session.scalars(self._in_review_query(agreement_id)).first()

    def get_in_review_edit_ids(self, agreement_id: int) -> set[int]:
        """Ids of the pending edits included in the agreement's request that is in review."""
        in_review = self.get_in_review(agreement_id)
        return {edit.id for edit in in_review.edits} if in_review else set()

    def submit(
        self,
        agreement_id: int,
        budget_line_item_ids: list[int],
        requestor_notes: Optional[str],
    ) -> ContractModificationRequest:
        """Send the agreement's pending edits, plus the selected Planned budget lines to execute,
        to the Division Director for approval."""
        self._check_enabled()
        agreement = self._edit_service._get_supported_agreement(agreement_id)

        user = get_current_user()
        if not (user.is_superuser or check_user_association(agreement, user)):
            raise AuthorizationError(
                f"User is not associated with the agreement {agreement_id}",
                "ContractModificationRequest",
            )

        if not agreement.is_awarded:
            raise ValidationError({"agreement_id": "Only an Awarded agreement can start a contract modification."})

        # Lock the pending rows so two concurrent submissions can't both include them.
        pending_edits = list(
            self.db_session.scalars(self._edit_service._pending_query(agreement_id).with_for_update()).all()
        )
        if self.get_in_review(agreement_id) is not None:
            raise ValidationError({"agreement_id": _ALREADY_IN_REVIEW})

        budget_line_items = self._get_executable_budget_lines(agreement_id, budget_line_item_ids)
        if not pending_edits and not budget_line_items:
            raise ValidationError(
                {"agreement_id": "Select a budget line to execute, or make an edit that requires a modification."}
            )

        request = ContractModificationRequest(
            agreement_id=agreement_id,
            status=ContractModificationRequestStatus.IN_REVIEW,
            requestor_notes=requestor_notes,
            # Set here: the flush below takes the row out of session.new before the
            # created_by hook (handle_create_update_by_attrs) runs at commit.
            created_by=user.id,
            # every pending row goes in, including superseded ones, so they attach to the mod together
            edits=pending_edits,
            budget_line_items=budget_line_items,
        )
        self.db_session.add(request)
        try:
            self.db_session.flush()
        except IntegrityError:
            # uq_contract_modification_request_one_in_review: a concurrent submission won
            self.db_session.rollback()
            raise ValidationError({"agreement_id": _ALREADY_IN_REVIEW})

        self._notify_division_directors(request)
        self.db_session.commit()
        return request

    def review(self, request_id: int, action: str, reviewer_notes: Optional[str]) -> ContractModificationRequest:
        """Approve or decline a contract modification request that is in review.

        All-or-nothing: on any error the session is rolled back, so a failed approval leaves no
        modification, no attached edits and no executed budget lines behind.
        """
        self._check_enabled()
        if action not in (APPROVE, DECLINE):
            raise ValidationError({"action": "Must be APPROVE or DECLINE."})
        try:
            # Lock the request so two concurrent reviews can't both pass the IN_REVIEW check.
            request = self.db_session.scalars(
                select(ContractModificationRequest)
                .where(ContractModificationRequest.id == request_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            ).first()
            if request is None:
                raise ResourceNotFoundError("ContractModificationRequest", request_id)

            user = get_current_user()
            directors, deputies = get_division_directors_for_agreement(request.agreement)
            if not (user.is_superuser or user.id in directors or user.id in deputies):
                raise AuthorizationError(
                    "User is not authorized to review this contract modification.",
                    "ContractModificationRequest",
                )

            if request.status != ContractModificationRequestStatus.IN_REVIEW:
                raise ValidationError({"status": "This contract modification has already been reviewed."})

            if action == APPROVE:
                self._approve(request)
            else:
                request.status = ContractModificationRequestStatus.DECLINED

            request.reviewed_by_id = user.id
            request.reviewed_on = datetime.now(timezone.utc).replace(tzinfo=None)
            request.reviewer_notes = reviewer_notes
            self._close_review_requests(request)
            self._notify_submitter(request)
            self.db_session.commit()
        except Exception:
            self.db_session.rollback()
            raise
        return request

    def _approve(self, request: ContractModificationRequest) -> None:
        # Re-run the submit-time checks before writing anything: a budget line may have been
        # executed, edited into review, or moved out of the current FY since the request was sent.
        self._get_executable_budget_lines(
            request.agreement_id, [budget_line_item.id for budget_line_item in request.budget_line_items]
        )
        # The Director reviewed the lines as they were sent; don't execute one that changed since
        # (e.g. an amount change request approved in the meantime).
        changed = [
            f"Budget line {bli.id} changed after this contract modification was sent; decline it and send a new one."
            for bli in request.budget_line_items
            if bli.updated_on and request.created_on and bli.updated_on > request.created_on
        ]
        if changed:
            raise ValidationError({"budget_line_item_ids": changed})

        agreement_mod = AgreementMod(agreement_id=request.agreement_id, mod_type=ModType.MODIFIED_LOE)
        self.db_session.add(agreement_mod)
        self.db_session.flush()

        self._edit_service.attach_pending_edits_to_mod(
            request.agreement_id, agreement_mod.id, [edit.id for edit in request.edits]
        )
        # Set directly: the BLI update and change request paths reject Executing on an Awarded
        # agreement (validate_no_execution_status_change_on_awarded), because this approval is
        # the only way to get there.
        for budget_line_item in request.budget_line_items:
            budget_line_item.status = BudgetLineItemStatus.IN_EXECUTION

        request.status = ContractModificationRequestStatus.APPROVED
        request.agreement_mod_id = agreement_mod.id

    def _get_executable_budget_lines(self, agreement_id: int, budget_line_item_ids: list[int]) -> list[BudgetLineItem]:
        """Only Planned, current-FY budget lines not already in review can be executed."""
        if not budget_line_item_ids:
            return []
        budget_line_items = list(
            self.db_session.scalars(select(BudgetLineItem).where(BudgetLineItem.id.in_(budget_line_item_ids))).all()
        )
        found_ids = {bli.id for bli in budget_line_items}
        errors = [f"Budget line {bli_id} not found." for bli_id in budget_line_item_ids if bli_id not in found_ids]
        current_fiscal_year = get_current_fiscal_year()
        for bli in budget_line_items:
            if bli.agreement_id != agreement_id:
                errors.append(f"Budget line {bli.id} is not on this agreement.")
            elif bli.status != BudgetLineItemStatus.PLANNED:
                errors.append(f"Budget line {bli.id} is not in Planned status.")
            elif bli.fiscal_year != current_fiscal_year:
                errors.append(f"Budget line {bli.id} is not in the current fiscal year.")
            elif bli.in_review:
                errors.append(f"Budget line {bli.id} has changes in review.")
        if errors:
            raise ValidationError({"budget_line_item_ids": errors})
        return budget_line_items

    def _notify_division_directors(self, request: ContractModificationRequest) -> None:
        directors, deputies = get_division_directors_for_agreement(request.agreement)
        fe_url = current_app.config.get("OPS_FRONTEND_URL")
        link = f"{fe_url}/agreements/{request.agreement_id}/award-modifications"
        for recipient_id in set(directors) | set(deputies):
            self._notification_service.create(
                {
                    "contract_modification_request_id": request.id,
                    "title": "Contract Modification Approval Request",
                    "message": (
                        "A Contract Modification has been submitted. "
                        f"Please review and approve. \n\\\n\\\n[Link]({link})"
                    ),
                    "is_read": False,
                    "recipient_id": recipient_id,
                    "notification_type": NotificationType.CONTRACT_MODIFICATION_REQUEST_NOTIFICATION,
                },
                commit=False,
            )

    def _close_review_requests(self, request: ContractModificationRequest) -> None:
        """Mark the Directors' "please review" notifications for this request read. Once reviewed
        they're stale, and they share a notification type with the submitter's outcome
        notification, so left unread they'd show as an Approved / Declined alert."""
        self.db_session.execute(
            update(ContractModificationRequestNotification)
            .where(
                ContractModificationRequestNotification.contract_modification_request_id == request.id,
                ContractModificationRequestNotification.is_read.is_(False),
            )
            .values(is_read=True)
            .execution_options(synchronize_session="fetch")
        )

    def _notify_submitter(self, request: ContractModificationRequest) -> None:
        approved = request.status == ContractModificationRequestStatus.APPROVED
        self._notification_service.create(
            {
                "contract_modification_request_id": request.id,
                "title": f"Contract Modification {'Approved' if approved else 'Declined'}",
                "message": (
                    "Your Contract Modification has been successfully approved by your Division Director."
                    if approved
                    else "Your Contract Modification has been declined by your Division Director."
                ),
                "is_read": False,
                "recipient_id": request.created_by,
                "notification_type": NotificationType.CONTRACT_MODIFICATION_REQUEST_NOTIFICATION,
            },
            commit=False,
        )

    @staticmethod
    def _check_enabled() -> None:
        if not current_app.config.get("ENABLE_MODIFIED_LOE_EDITS", False):
            raise ValidationError({"agreement_id": "Contract modifications are not enabled."})

    @staticmethod
    def _in_review_query(agreement_id: int):
        return (
            select(ContractModificationRequest)
            .options(selectinload(ContractModificationRequest.edits))
            .where(
                ContractModificationRequest.agreement_id == agreement_id,
                ContractModificationRequest.status == ContractModificationRequestStatus.IN_REVIEW,
            )
        )
