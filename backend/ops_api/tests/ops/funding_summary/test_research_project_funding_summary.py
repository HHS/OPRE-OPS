import pytest
from flask import url_for

from models import (
    CAN,
    AgreementType,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
    ResearchProject,
)


def test_get_research_project_funding_summary(auth_client, app_ctx, db_loaded_with_research_projects):
    query_string = {"portfolioId": 1, "fiscalYear": 2023}

    response = auth_client.get(url_for("api.research-project-funding-summary-group"), query_string=query_string)

    assert response.status_code == 200
    assert response.json["total_funding"] == 20000000.0


def test_get_research_project_funding_summary_invalid_query_string(
    auth_client, app_ctx, db_loaded_with_research_projects
):
    query_string = {"portfolioId": "blah", "fiscalYear": "blah"}

    response = auth_client.get(url_for("api.research-project-funding-summary-group"), query_string=query_string)

    assert response.status_code == 400
    assert response.json == {
        "portfolioId": ["Not a valid integer."],
        "fiscalYear": ["Not a valid integer."],
    }


def test_get_research_project_funding_summary_invalid_query_string_portfolio_id(
    auth_client, app_ctx, db_loaded_with_research_projects
):
    query_string = {"portfolioId": 0, "fiscalYear": 2020}

    response = auth_client.get(url_for("api.research-project-funding-summary-group"), query_string=query_string)

    assert response.status_code == 400
    assert response.json == {"portfolioId": ["Must be greater than or equal to 1."]}


def test_get_research_project_funding_summary_invalid_query_string_fiscal_year(
    auth_client, app_ctx, db_loaded_with_research_projects
):
    query_string = {"portfolioId": 1, "fiscalYear": 1899}

    response = auth_client.get(url_for("api.research-project-funding-summary-group"), query_string=query_string)

    assert response.status_code == 400
    assert response.json == {"fiscalYear": ["Must be greater than or equal to 1900."]}


def test_get_research_project_funding_summary_no_data(auth_client, app_ctx, db_loaded_with_research_projects):
    query_string = {"portfolioId": 1000, "fiscalYear": 1910}

    response = auth_client.get(url_for("api.research-project-funding-summary-group"), query_string=query_string)

    assert response.status_code == 200
    assert response.json["total_funding"] == 0


@pytest.fixture()
def db_loaded_with_research_projects(app, loaded_db, app_ctx):
    with app.app_context():
        research_project_rp1 = ResearchProject(title="RP1", short_title="RP1")
        research_project_rp2 = ResearchProject(title="RP2", short_title="RP2")

        research_project_rp1.portfolio_id = 1
        research_project_rp2.portfolio_id = 1

        loaded_db.add_all([research_project_rp1, research_project_rp2])
        loaded_db.commit()

        can_1 = CAN(number="CAN1", portfolio_id=1)
        can_2 = CAN(number="CAN2", portfolio_id=1)
        can_3 = CAN(number="CAN3", portfolio_id=1)
        can_4 = CAN(number="CAN4", portfolio_id=1)

        loaded_db.add_all([can_1, can_2, can_3, can_4])
        loaded_db.commit()

        agreement_1 = ContractAgreement(
            name="Agreement 1",
            agreement_type=AgreementType.CONTRACT,
            project_id=research_project_rp1.id,
        )
        agreement_2 = GrantAgreement(
            name="Agreement 2",
            agreement_type=AgreementType.GRANT,
            project_id=research_project_rp2.id,
            foa="foa",
        )

        loaded_db.add_all([agreement_1, agreement_2])
        loaded_db.commit()

        blin_1 = ContractBudgetLineItem(
            line_description="#1",
            amount=1.0,
            can_id=can_1.id,
            agreement_id=agreement_1.id,
        )
        blin_2 = ContractBudgetLineItem(
            line_description="#2",
            amount=2.0,
            can_id=can_2.id,
            agreement_id=agreement_1.id,
        )
        blin_3 = ContractBudgetLineItem(
            line_description="#3",
            amount=3.0,
            can_id=can_3.id,
            agreement_id=agreement_1.id,
        )
        blin_4 = GrantBudgetLineItem(
            line_description="#4",
            amount=4.0,
            can_id=can_4.id,
            agreement_id=agreement_2.id,
        )

        loaded_db.add_all([blin_1, blin_2, blin_3, blin_4])
        loaded_db.commit()

        loaded_db.add_all([agreement_1, agreement_2])
        loaded_db.commit()

        yield loaded_db

        for obj in [
            research_project_rp1,
            research_project_rp2,
            can_1,
            can_2,
            can_3,
            can_4,
            agreement_1,
            agreement_2,
            blin_1,
            blin_2,
            blin_3,
            blin_4,
        ]:
            loaded_db.delete(obj)
        loaded_db.commit()
