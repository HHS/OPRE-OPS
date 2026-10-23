"""Tests for the ALLOW_PAST_OBLIGATE_BY_DATES capability (issue 6443).

When ON, a non-Draft budget line's Obligate By date (date_needed) may be in the past; the
within-Period-of-Performance rule still applies.

Exercised as basic_user_auth_client (id 521, VIEWER_EDITOR) — no super-user bypass — whose
accepted non-Draft edits become Change Requests, hence 202.
"""

import datetime

import pytest
from flask import url_for

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    ServicesComponent,
    User,
)

BASIC_USER_ID = 521
SYSTEM_OWNER_USER_ID = 503
PAST_DATE = "2020-06-21"
POP_ERROR = "within the agreement's start and end dates"


@pytest.fixture()
def past_dates_allowed(app, monkeypatch):
    monkeypatch.setitem(app.config, "ALLOW_PAST_OBLIGATE_BY_DATES", True)


def _make_agreement(loaded_db, test_project, period_start=None, period_end=None):
    """A non-awarded contract with basic user 521 on the team and one services component."""
    agreement = ContractAgreement(
        name="Past Obligate By Test Agreement",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for the ALLOW_PAST_OBLIGATE_BY_DATES tests",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.flush()
    agreement.team_members.append(loaded_db.get(User, BASIC_USER_ID))
    sc = ServicesComponent(
        agreement_id=agreement.id, number=1, optional=False, period_start=period_start, period_end=period_end
    )
    loaded_db.add(sc)
    loaded_db.commit()
    return agreement, sc


def _make_planned_bli(loaded_db, agreement, sc, test_can, date_needed):
    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="Past Obligate By test BLI",
        amount=100.00,
        can_id=test_can.id,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date_needed,
        services_component_id=sc.id,
        proc_shop_fee_percentage=0,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli


def _bli_url(bli):
    return url_for("api.budget-line-items-item", id=bli.id)


def test_patch_planned_bli_to_past_date_is_accepted(
    past_dates_allowed, basic_user_auth_client, loaded_db, test_project, test_can
):
    agreement, sc = _make_agreement(loaded_db, test_project)
    bli = _make_planned_bli(loaded_db, agreement, sc, test_can, datetime.date(2043, 1, 1))

    response = basic_user_auth_client.patch(_bli_url(bli), json={"date_needed": PAST_DATE})

    assert response.status_code == 202, response.json


def test_editing_amount_on_past_dated_planned_bli_is_accepted(
    past_dates_allowed, basic_user_auth_client, loaded_db, test_project, test_can
):
    agreement, sc = _make_agreement(loaded_db, test_project)
    bli = _make_planned_bli(loaded_db, agreement, sc, test_can, datetime.date.fromisoformat(PAST_DATE))

    response = basic_user_auth_client.patch(_bli_url(bli), json={"amount": 250.00})

    assert response.status_code == 202, response.json


def test_date_outside_period_of_performance_still_rejected_when_flag_on(
    past_dates_allowed, basic_user_auth_client, loaded_db, test_project, test_can
):
    agreement, sc = _make_agreement(
        loaded_db, test_project, period_start=datetime.date(2020, 1, 1), period_end=datetime.date(2020, 12, 31)
    )
    bli = _make_planned_bli(loaded_db, agreement, sc, test_can, datetime.date(2020, 6, 1))

    response = basic_user_auth_client.patch(_bli_url(bli), json={"date_needed": "2019-06-01"})

    assert response.status_code == 400, response.json
    assert POP_ERROR in response.json["errors"]["date_needed"]
