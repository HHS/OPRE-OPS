"""Service for the Award & Modification History tab.

Aggregates award/modification data for a single Contract or AA agreement into a
flat list of records, one per completed procurement action (initial award plus
each completed modification). Data is stitched together from four models:

- ``ProcurementAction`` — one row per award/mod cycle (award/contract totals, award date).
- ``ProcurementTracker`` / ``DefaultProcurementTrackerStep`` — the AWARD step carries
  vendor + award amount/date; the PRE_AWARD step carries requisition number/approval date.
- ``AgreementMod`` — modification number (null for the initial award).
- ``ContractAgreement`` / ``AaAgreement`` — agreement-level ``po_number`` /
  ``task_order_number`` / ``contract_number`` (single value repeated across every row).
"""

from datetime import date
from typing import Optional

from flask import current_app
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models import (
    Agreement,
    AgreementType,
    DefaultProcurementTrackerStep,
    ProcurementAction,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepType,
)
from models.utils.fiscal_year import date_to_fiscal_year
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError

# Agreement types that expose po_number / task_order_number / contract_number and
# are in scope for this tab. Reading those attributes on any other subtype raises
# AttributeError, so this check is load-bearing, not just a scoping nicety.
_SUPPORTED_AGREEMENT_TYPES = (AgreementType.CONTRACT, AgreementType.AA)


def build_fiscal_year_label(action_date: Optional[date], is_modification: bool, mod_number: Optional[str]) -> str:
    """Build the accordion header label for an award/mod cycle.

    Examples: ``"FY 2024 Award"``, ``"FY 2025 Mod 1"``. ``mod_number`` is the
    ``AgreementMod.number`` string, which already reads like ``"Mod 1"``. When the
    cycle has no date the ``"FY {year}"`` prefix is dropped (``"Award"`` /
    ``"Mod 1"``). When a modification has no number, ``"Mod"`` is used on its own.
    """
    if is_modification:
        base = mod_number if mod_number else "Mod"
    else:
        base = "Award"

    if action_date is None:
        return base
    return f"FY {date_to_fiscal_year(action_date)} {base}"


class AgreementAwardHistoryService:
    """Aggregates award/modification history for a Contract or AA agreement."""

    def __init__(self, db_session=None):
        self.db_session = db_session or current_app.db_session

    def get_award_history(self, agreement_id: int) -> list[dict]:
        """Return the flat award/modification history for an agreement.

        Args:
            agreement_id: The agreement ID.

        Returns:
            A list of flat record dicts (see module docstring), ordered oldest-first
            (initial award, then modifications chronologically).

        Raises:
            ResourceNotFoundError: The agreement does not exist.
            ValidationError: The agreement is not a Contract or AA agreement.
        """
        agreement = self.db_session.get(Agreement, agreement_id)
        if agreement is None:
            raise ResourceNotFoundError("Agreement", agreement_id)

        if agreement.agreement_type not in _SUPPORTED_AGREEMENT_TYPES:
            raise ValidationError(
                {"agreement_type": ("Award & Modification history is only available for Contract and AA agreements.")}
            )

        # Agreement-level fields resolve directly off the polymorphic instance —
        # SQLAlchemy returns a live ContractAgreement/AaAgreement, so these "just work".
        # They are the same value on every accordion (see Decision 1 in the story).
        po_number = agreement.po_number
        task_order_number = agreement.task_order_number
        contract_number = agreement.contract_number

        # Map each procurement action to its COMPLETED tracker (if any).
        completed_trackers_by_action = self._completed_trackers_by_action(agreement_id)
        if not completed_trackers_by_action:
            return []

        actions = self.db_session.scalars(
            select(ProcurementAction)
            .where(ProcurementAction.agreement_id == agreement_id)
            .options(selectinload(ProcurementAction.agreement_mod))
        ).all()

        records = []
        for action in actions:
            tracker = completed_trackers_by_action.get(action.id)
            if tracker is None:
                continue
            records.append(
                self._build_record(
                    action=action,
                    tracker=tracker,
                    po_number=po_number,
                    task_order_number=task_order_number,
                    contract_number=contract_number,
                )
            )

        # Oldest-first: initial award, then modifications in chronological order.
        # Undated cycles sort to the end; the initial award (not a mod) wins ties.
        records.sort(key=lambda r: (r["_sort_date"] or date.max, r["_is_modification"]))
        for record in records:
            record.pop("_sort_date", None)
            record.pop("_is_modification", None)
        return records

    def _completed_trackers_by_action(self, agreement_id: int) -> dict[int, ProcurementTracker]:
        """Return a map of procurement_action_id -> its COMPLETED tracker for the agreement.

        If more than one completed tracker points at the same action, the first is kept.
        """
        trackers = self.db_session.scalars(
            select(ProcurementTracker).where(
                ProcurementTracker.agreement_id == agreement_id,
                ProcurementTracker.status == ProcurementTrackerStatus.COMPLETED,
                ProcurementTracker.procurement_action.isnot(None),
            )
            # Eager-load steps and, for AWARD steps, the linked vendor so
            # _build_record's vendor lookups don't trigger a query per record.
            # award_vendor lives on the DefaultProcurementTrackerStep subclass,
            # so reach it through of_type().
            .options(
                selectinload(ProcurementTracker.steps.of_type(DefaultProcurementTrackerStep)).selectinload(
                    DefaultProcurementTrackerStep.award_vendor
                )
            )
        ).all()

        by_action: dict[int, ProcurementTracker] = {}
        for tracker in trackers:
            by_action.setdefault(tracker.procurement_action, tracker)
        return by_action

    def _build_record(
        self,
        action: ProcurementAction,
        tracker: ProcurementTracker,
        po_number: Optional[str],
        task_order_number: Optional[str],
        contract_number: Optional[str],
    ) -> dict:
        award_step = self._find_step(tracker, ProcurementTrackerStepType.AWARD)
        pre_award_step = self._find_step(tracker, ProcurementTrackerStepType.PRE_AWARD)
        vendor = award_step.award_vendor if award_step else None

        is_modification = action.agreement_mod_id is not None
        mod = action.agreement_mod
        mod_number = mod.number if mod else None
        action_date = mod.mod_date if (is_modification and mod) else action.date_awarded_obligated

        return {
            "fiscal_year_label": build_fiscal_year_label(action_date, is_modification, mod_number),
            "award_date": action.date_awarded_obligated,
            "award_amount": award_step.award_amount if award_step else None,
            "contract_total": action.agreement_total,
            "contract_number": contract_number,
            "modification_number": mod_number if is_modification else "Base",
            "requisition_approval_date": (
                pre_award_step.pre_award_requisition_approved_date if pre_award_step else None
            ),
            "requisition_number": pre_award_step.pre_award_requisition_number if pre_award_step else None,
            "vendor_name": vendor.name if vendor else None,
            "vendor_unique_entity_id": vendor.duns if vendor else None,
            "vendor_type": vendor.vendor_type if vendor else None,
            "purchase_order_number": po_number,
            "task_order_number": task_order_number,
            # Internal sort keys, stripped before returning.
            "_sort_date": action_date,
            "_is_modification": is_modification,
        }

    @staticmethod
    def _find_step(tracker: ProcurementTracker, step_type: ProcurementTrackerStepType):
        """Return the tracker's step of the given type, or None."""
        for step in tracker.steps:
            if step.step_type == step_type:
                return step
        return None
