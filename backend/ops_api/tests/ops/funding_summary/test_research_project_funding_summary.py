import pytest
from models.cans import CAN, BudgetLineItem, CANFiscalYear
from models.research_projects import ResearchProject


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def db_loaded_with_research_projects(app, loaded_db):
    """
    Given a set of ResearchProject/CAN/Funding data below with the current FY 2023
      | Research Project | Managed CAN | CAN FY | Funding |
      | 100                | 100           | 2023   | $5      |
      | 100                | 200           | 2023   | $7      |
      | 100                | 300           | 2023   | $3      |
      | 100                | 100           | 2022   | $5      |
      | 100                | 200           | 2022   | $5      |
      | 200                | 400           | 2023   | $5      |
    """
    with app.app_context():
        instances = []

        research_project_100 = ResearchProject(id=100, title="RP100")
        research_project_200 = ResearchProject(id=200, title="RP200")

        research_project_100.portfolio_id = 1
        research_project_200.portfolio_id = 1

        instances.extend([research_project_100, research_project_200])

        can_100 = CAN(id=100, number="CAN100")
        can_200 = CAN(id=200, number="CAN200")
        can_300 = CAN(id=300, number="CAN300")
        can_400 = CAN(id=400, number="CAN400")

        research_project_100.cans.extend([can_100, can_200, can_300])
        research_project_200.cans.append(can_400)

        instances.extend([can_100, can_200, can_300, can_400])

        can_fy_100_2023 = CANFiscalYear(can_id=can_100.id, fiscal_year=2023, current_funding=5)
        can_fy_200_2023 = CANFiscalYear(can_id=can_200.id, fiscal_year=2023, current_funding=7)
        can_fy_300_2023 = CANFiscalYear(can_id=can_300.id, fiscal_year=2023, current_funding=3)
        can_fy_100_2022 = CANFiscalYear(can_id=can_100.id, fiscal_year=2022, current_funding=5)
        can_fy_200_2022 = CANFiscalYear(can_id=can_200.id, fiscal_year=2022, current_funding=5)
        can_fy_400_2023 = CANFiscalYear(can_id=can_400.id, fiscal_year=2023, current_funding=5)

        instances.extend(
            [
                can_fy_100_2023,
                can_fy_200_2023,
                can_fy_300_2023,
                can_fy_100_2022,
                can_fy_200_2022,
                can_fy_400_2023,
            ]
        )

        loaded_db.session.add_all(instances)

        loaded_db.session.commit()
        yield loaded_db

        # Cleanup
        for instance in instances:
            loaded_db.session.delete(instance)
        loaded_db.session.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("db_loaded_with_research_projects")
def test_get_research_project_funding_summary(auth_client):
    query_string = {"portfolioId": 1, "fiscalYear": 2023}
    response = auth_client.get("/api/v1/research-project-funding-summary/", query_string=query_string)
    assert response.status_code == 200
    assert response.json["total_funding"] == 20


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("db_loaded_with_research_projects")
def test_get_research_project_funding_summary_invalid_query_string(auth_client):
    query_string = {"portfolioId": "blah", "fiscalYear": "blah"}
    response = auth_client.get("/api/v1/research-project-funding-summary/", query_string=query_string)
    assert response.status_code == 400
    assert response.json == {
        "portfolio_id": ["Not a valid integer."],
        "fiscal_year": ["Not a valid integer."],
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("db_loaded_with_research_projects")
def test_get_research_project_funding_summary_invalid_query_string_portfolio_id(
    auth_client,
):
    query_string = {"portfolioId": 0, "fiscalYear": 2020}
    response = auth_client.get("/api/v1/research-project-funding-summary/", query_string=query_string)
    assert response.status_code == 400
    assert response.json == {"portfolio_id": ["Must be greater than or equal to 1."]}


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("db_loaded_with_research_projects")
def test_get_research_project_funding_summary_invalid_query_string_fiscal_year(
    auth_client,
):
    query_string = {"portfolioId": 1, "fiscalYear": 1899}
    response = auth_client.get("/api/v1/research-project-funding-summary/", query_string=query_string)
    assert response.status_code == 400
    assert response.json == {"fiscal_year": ["Must be greater than or equal to 1900."]}


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("db_loaded_with_research_projects")
def test_get_research_project_funding_summary_no_data(auth_client):
    query_string = {"portfolioId": 1000, "fiscalYear": 1910}
    response = auth_client.get("/api/v1/research-project-funding-summary/", query_string=query_string)
    assert response.status_code == 200
    assert response.json["total_funding"] == 0


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def db_loaded_with_research_projects_for_total_spending(app, loaded_db):
    """
    Scenario: Calculate Research Project total spending for a given FY.
    Given a set of ResearchProject/CAN/Funding data below with the current FY 2023
      | Research Project | Managed CAN | CAN FY | BLIN | BLIN Amount |
      | 1                | 1           | 2023 | 1    | $1          |
      | 1                | 2           | 2023 | 2    | $2          |
      | 1                | 3           | 2022 | 3    | $3          |
      | 1                | 3           | 2023 | 4    | $4          |
      | 2                | 4           | 2023 | 5    | $5          |

    When I calculate the total spending for Research Project 1 in FY 2023
    Then the result should be $7.
    """
    with app.app_context():
        instances = []

        research_project_100 = ResearchProject(id=100, title="RP100")
        research_project_200 = ResearchProject(id=200, title="RP200")

        research_project_100.portfolio_id = 1
        research_project_200.portfolio_id = 1

        instances.extend([research_project_100, research_project_200])

        can_100 = CAN(id=100, number="CAN100")
        can_200 = CAN(id=200, number="CAN200")
        can_300 = CAN(id=300, number="CAN300")
        can_400 = CAN(id=400, number="CAN400")

        research_project_100.cans.extend([can_100, can_200, can_300])
        research_project_200.cans.append(can_400)

        can_100_fy_2023 = CANFiscalYear(can_id=can_100, fiscal_year=2023)
        can_200_fy_2023 = CANFiscalYear(can_id=200, fiscal_year=2023)
        can_300_fy_2022 = CANFiscalYear(can_id=300, fiscal_year=2022)
        can_300_fy_2023 = CANFiscalYear(can_id=300, fiscal_year=2023)
        can_400_fy_2023 = CANFiscalYear(can_id=400, fiscal_year=2023)

        blin_1 = BudgetLineItem(id=100, amount=1.0)
        blin_2 = BudgetLineItem(id=200, amount=2.0)
        blin_3 = BudgetLineItem(id=300, amount=3.0)
        blin_4 = BudgetLineItem(id=400, amount=4.0)

        blin_1.can_fiscal_year.append(can_100_fy_2023)
        blin_2.can_fiscal_year.append(can_200_fy_2023)
        blin_3.can_fiscal_year.append(can_300_fy_2022)
        blin_3.can_fiscal_year.append(can_300_fy_2023)
        blin_4.can_fiscal_year.append(can_400_fy_2023)

        loaded_db.session.add_all(instances)

        loaded_db.session.commit()
        yield loaded_db

        # Cleanup
        for instance in instances:
            loaded_db.session.delete(instance)
        loaded_db.session.commit()
