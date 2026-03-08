from decimal import Decimal
from typing import Optional

from sqlalchemy import and_, select
from sqlalchemy.orm import Session, joinedload

from models import Agreement, AgreementType, BudgetLineItem, BudgetLineItemStatus
from models.agreements import AgreementClassification

SPENDING_STATUSES = [
    BudgetLineItemStatus.PLANNED,
    BudgetLineItemStatus.IN_EXECUTION,
    BudgetLineItemStatus.OBLIGATED,
]

AGREEMENT_TYPE_CONFIG = [
    {"type": "CONTRACT", "label": "Contracts", "agreement_types": [AgreementType.CONTRACT]},
    {"type": "PARTNER", "label": "Partner", "agreement_types": [AgreementType.IAA, AgreementType.AA]},
    {"type": "GRANT", "label": "Grants", "agreement_types": [AgreementType.GRANT]},
    {
        "type": "DIRECT_OBLIGATION",
        "label": "Direct Oblig.",
        "agreement_types": [AgreementType.DIRECT_OBLIGATION],
    },
]


def classify_agreement_for_fy(agreement: Agreement, fiscal_year: int) -> Optional[str]:
    """
    Classify agreement as NEW, CONTINUING, or None for a given fiscal year.

    Replicates Agreement.award_type property logic but accepts explicit fiscal year.
    """
    has_non_draft_blis = any(
        bli.status is not None and bli.status != BudgetLineItemStatus.DRAFT for bli in agreement.budget_line_items
    )

    if not has_non_draft_blis:
        return None

    if not agreement.is_awarded:
        return AgreementClassification.NEW.name

    award_fy = agreement.award_fiscal_year
    if award_fy is None:
        return AgreementClassification.NEW.name

    if fiscal_year <= award_fy:
        return AgreementClassification.NEW.name

    return AgreementClassification.CONTINUING.name


def _find_bucket_type(agreement_type):
    """Find the spending bucket type for a given agreement type."""
    for config in AGREEMENT_TYPE_CONFIG:
        if agreement_type in config["agreement_types"]:
            return config["type"]
    return None


def _accumulate_agreement_spending(agreement, fiscal_year, totals):
    """Accumulate BLI spending from a single agreement into totals."""
    bucket_type = _find_bucket_type(agreement.agreement_type)
    if bucket_type is None:
        return

    classification = classify_agreement_for_fy(agreement, fiscal_year)
    if classification is None:
        return

    key = "new" if classification == AgreementClassification.NEW.name else "continuing"
    for bli in agreement.budget_line_items:
        if bli.fiscal_year == fiscal_year and bli.status in SPENDING_STATUSES:
            totals[bucket_type][key] += bli.total or Decimal(0)


def get_agreement_spending_by_type(session: Session, fiscal_year: int) -> dict:
    """Get agreement spending grouped by agreement type for a given fiscal year."""
    stmt = (
        select(Agreement)
        .join(Agreement.budget_line_items)
        .where(
            and_(
                BudgetLineItem.fiscal_year == fiscal_year,
                BudgetLineItem.status.in_(SPENDING_STATUSES),
            )
        )
        .options(
            joinedload(Agreement.budget_line_items),
            joinedload(Agreement.procurement_actions),
        )
        .distinct()
    )

    agreements = session.execute(stmt).unique().scalars().all()

    totals = {config["type"]: {"new": Decimal(0), "continuing": Decimal(0)} for config in AGREEMENT_TYPE_CONFIG}

    for agreement in agreements:
        _accumulate_agreement_spending(agreement, fiscal_year, totals)

    total_spending = sum(t["new"] + t["continuing"] for t in totals.values())

    agreement_types = []
    for config in AGREEMENT_TYPE_CONFIG:
        bucket = totals[config["type"]]
        type_total = bucket["new"] + bucket["continuing"]
        agreement_types.append(
            {
                "type": config["type"],
                "label": config["label"],
                "total": float(type_total),
                "percent": _get_percentage(total_spending, type_total),
                "new": float(bucket["new"]),
                "continuing": float(bucket["continuing"]),
            }
        )

    return {
        "total_spending": float(total_spending),
        "agreement_types": agreement_types,
    }


def _get_percentage(total: Decimal, part: Decimal) -> str:
    if not total:
        return "0"
    return f"{round(float(part) / float(total), 2) * 100}"
