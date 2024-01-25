import datetime

import pytest
from models.cans import CLIN, ServicesComponent

# Assuming that your testing setup includes a fixture for the database and an authenticated client


@pytest.mark.usefixtures("app_ctx")
def test_services_component_retrieve(loaded_db):
    sc = loaded_db.query(ServicesComponent).filter(ServicesComponent.number == 1).one()

    assert sc is not None
    assert sc.number == 1
    assert sc.optional is False
    assert sc.clin is not None  # Assuming there's a CLIN associated
    assert sc.description == "Perform Research"
    assert sc.period_start == datetime.date(2043, 6, 13)  # 2043-06-13
    assert sc.period_end == datetime.date(2044, 6, 13)
    assert len(sc.budget_line_items) > 0
    assert sc.period_duration is not None
    assert sc.display_title == "Services Component 1"
    assert sc.display_name == "SC1"


def test_services_component_creation(loaded_db):
    clin = CLIN(id=123, name="123")  # Assuming a CLIN object is required

    sc = ServicesComponent(
        number=2,
        optional=True,
        clin_id=clin.id,
        description="Optional Services Component",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )

    assert sc is not None
    assert sc.number == 2
    assert sc.optional
    assert sc.clin_id == clin.id
    assert sc.period_duration.days == 181
    assert sc.display_title == "Optional Services Component 2"
    assert sc.display_name == "OSC2"


def test_services_component_get_all(auth_client, loaded_db):
    # count = loaded_db.query(ServicesComponent).count()

    response = auth_client.get("/api/v1/services_components/")
    assert response.status_code == 404
    # assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_services_component_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/services_components/1")
    assert response.status_code == 404
    # assert response.json["number"] == 1
    # assert response.json["description"] == "Description of SC 1"


@pytest.mark.usefixtures("app_ctx")
def test_period_duration_calculation(loaded_db):
    # Test for a Services Component with both start and end dates
    sc_with_dates = ServicesComponent(
        number=3, optional=False, period_start=datetime.date(2024, 1, 1), period_end=datetime.date(2024, 3, 1)
    )

    expected_duration = (sc_with_dates.period_end - sc_with_dates.period_start).days
    assert sc_with_dates.period_duration.days == expected_duration


@pytest.mark.usefixtures("app_ctx")
def test_period_duration_calculation_with_missing_dates(loaded_db):
    # Test for a Services Component with no end date
    sc_no_end_date = ServicesComponent(
        number=4, optional=False, period_start=datetime.date(2024, 1, 1), period_end=None
    )

    assert sc_no_end_date.period_duration is None

    # Test for a Services Component with no start date
    sc_no_start_date = ServicesComponent(
        number=5, optional=False, period_start=None, period_end=datetime.date(2024, 3, 1)
    )

    assert sc_no_start_date.period_duration is None

    # Test for a Services Component with neither start nor end dates
    sc_no_dates = ServicesComponent(number=6, optional=False, period_start=None, period_end=None)

    assert sc_no_dates.period_duration is None
