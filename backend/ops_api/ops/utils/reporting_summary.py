from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from models import CAN, Agreement, AgreementType, BudgetLineItem, BudgetLineItemStatus, Project
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


def _find_bucket_type(agreement_type):
    """Find the spending bucket type for a given agreement type."""
    for config in AGREEMENT_TYPE_CONFIG:
        if agreement_type in config["agreement_types"]:
            return config["type"]
    return None


def _accumulate_agreement_spending(agreement, fiscal_year, totals, portfolio_ids=None):
    """Accumulate BLI spending from a single agreement into totals."""
    bucket_type = _find_bucket_type(agreement.agreement_type)
    if bucket_type is None:
        return

    classification = agreement.award_type  # Use award_type property for consistency with Agreements list
    if classification is None:
        return

    portfolio_id_set = set(portfolio_ids) if portfolio_ids else None
    key = "new" if classification == AgreementClassification.NEW.name else "continuing"
    for bli in agreement.budget_line_items:
        if bli.fiscal_year == fiscal_year and bli.status in SPENDING_STATUSES:
            if not bli.can:
                continue
            if portfolio_id_set and bli.can.portfolio_id not in portfolio_id_set:
                continue
            totals[bucket_type][key] += bli.total or Decimal(0)


def get_agreement_spending_by_type(session: Session, fiscal_year: int, portfolio_ids=None) -> dict:
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
            joinedload(Agreement.budget_line_items).joinedload(BudgetLineItem.can),
            joinedload(Agreement.procurement_actions),
        )
        .distinct()
    )

    stmt = _apply_portfolio_filter(stmt, portfolio_ids)

    agreements = session.execute(stmt).unique().scalars().all()

    totals = {config["type"]: {"new": Decimal(0), "continuing": Decimal(0)} for config in AGREEMENT_TYPE_CONFIG}

    for agreement in agreements:
        _accumulate_agreement_spending(agreement, fiscal_year, totals, portfolio_ids)

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


def _get_percentage(total: Decimal, part: Decimal) -> int:
    if not total:
        return 0
    return round(float(part) / float(total) * 100)


def _apply_portfolio_filter(stmt, portfolio_ids):
    """Apply portfolio_ids filter by joining BudgetLineItem to CAN."""
    if portfolio_ids:
        stmt = stmt.join(CAN, BudgetLineItem.can_id == CAN.id).where(CAN.portfolio_id.in_(portfolio_ids))
    return stmt


def _build_type_list(counts_dict):
    """Build a {total, types} dict from a counts dictionary keyed by agreement type."""
    types = []
    total = 0
    for config in AGREEMENT_TYPE_CONFIG:
        c = counts_dict[config["type"]]
        types.append({"type": config["type"], "count": c})
        total += c
    return {"total": total, "types": types}


def get_reporting_counts(session: Session, fiscal_year: int, portfolio_ids=None) -> dict:
    """Get reporting counts for projects, agreements, and budget lines for a given fiscal year."""

    # --- Projects: count by type (projects with at least one BLI in the FY) ---
    project_stmt = (
        select(Project.project_type, func.count(func.distinct(Project.id)))
        .join(Agreement, Agreement.project_id == Project.id)
        .join(BudgetLineItem, BudgetLineItem.agreement_id == Agreement.id)
        .where(BudgetLineItem.fiscal_year == fiscal_year)
    )
    project_stmt = _apply_portfolio_filter(project_stmt, portfolio_ids)
    project_type_counts = session.execute(project_stmt.group_by(Project.project_type)).all()

    project_types = []
    project_total = 0
    for pt, count in project_type_counts:
        project_types.append({"type": pt.name, "count": count})
        project_total += count

    projects = {"total": project_total, "types": project_types}

    # --- Agreements: count by grouped type (non-DRAFT BLIs in FY) ---
    stmt = (
        select(Agreement)
        .join(Agreement.budget_line_items)
        .where(
            and_(
                BudgetLineItem.fiscal_year == fiscal_year,
                BudgetLineItem.status != BudgetLineItemStatus.DRAFT,
                BudgetLineItem.status.isnot(None),
            )
        )
        .options(
            joinedload(Agreement.budget_line_items),
            joinedload(Agreement.procurement_actions),
        )
        .distinct()
    )
    stmt = _apply_portfolio_filter(stmt, portfolio_ids)
    agreements_list = session.execute(stmt).unique().scalars().all()

    agreement_counts = {config["type"]: 0 for config in AGREEMENT_TYPE_CONFIG}
    new_counts = {config["type"]: 0 for config in AGREEMENT_TYPE_CONFIG}
    continuing_counts = {config["type"]: 0 for config in AGREEMENT_TYPE_CONFIG}

    for agreement in agreements_list:
        bucket_type = _find_bucket_type(agreement.agreement_type)
        if bucket_type is None:
            continue
        agreement_counts[bucket_type] += 1

        classification = agreement.award_type
        if classification == AgreementClassification.NEW.name:
            new_counts[bucket_type] += 1
        elif classification == AgreementClassification.CONTINUING.name:
            continuing_counts[bucket_type] += 1

    agreements = _build_type_list(agreement_counts)
    new_agreements = _build_type_list(new_counts)
    continuing_agreements = _build_type_list(continuing_counts)

    # --- Budget lines: count by status for the FY ---
    bli_stmt = select(BudgetLineItem.status, func.count(BudgetLineItem.id)).where(
        BudgetLineItem.fiscal_year == fiscal_year
    )
    bli_stmt = _apply_portfolio_filter(bli_stmt, portfolio_ids)
    bli_status_counts = session.execute(bli_stmt.group_by(BudgetLineItem.status)).all()

    bli_types = []
    bli_total = 0
    for status, count in bli_status_counts:
        if status is not None:
            bli_types.append({"type": status.name, "count": count})
            bli_total += count

    budget_lines = {"total": bli_total, "types": bli_types}

    return {
        "projects": projects,
        "agreements": agreements,
        "new_agreements": new_agreements,
        "continuing_agreements": continuing_agreements,
        "budget_lines": budget_lines,
    }
