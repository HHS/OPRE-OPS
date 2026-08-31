from models import CAN, CLIN, ContractAgreement, ContractBudgetLineItem
from models.budget_line_items import BudgetLineItemStatus


def test_clin_retrieve(loaded_db, app_ctx):
    # Test CLIN lazy creation via service layer
    # Get a contract agreement to attach the BLI and CLIN to
    agreement = loaded_db.query(ContractAgreement).first()
    assert agreement is not None, "Test requires at least one contract agreement in test data"

    # Get an existing CAN from test data
    can = loaded_db.query(CAN).first()
    assert can is not None, "Test requires at least one CAN in test data"

    # Create a CLIN record first (normally done by the BLI service during CLIN assignment)
    clin = CLIN(
        number=999,
        name="CLIN 999",
        agreement_id=agreement.id,
        pop_start_date=agreement.sc_start_date,
        pop_end_date=agreement.sc_end_date,
    )
    loaded_db.add(clin)
    loaded_db.flush()

    # Create a test BLI with clin_id reference
    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        can_id=can.id,
        amount=1000,
        status=BudgetLineItemStatus.DRAFT,
        clin_id=clin.id,  # Reference the CLIN we just created
    )
    loaded_db.add(bli)
    loaded_db.flush()

    # Verify CLIN exists and is linked to the agreement
    retrieved_clin = loaded_db.query(CLIN).filter(CLIN.number == 999, CLIN.agreement_id == agreement.id).first()
    assert retrieved_clin is not None, "CLIN should exist"
    assert retrieved_clin.name == "CLIN 999"
    assert retrieved_clin.id == clin.id


def test_clin_get_all(auth_client, loaded_db, app_ctx):
    # count = loaded_db.query(CLIN).count()

    response = auth_client.get("/api/v1/clins/")
    assert response.status_code == 404
    # assert len(response.json) == count


def test_clin_get_by_id(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/clins/123")
    assert response.status_code == 404
    # assert response.json["name"] == "123"
    # assert "services_component" in response.json
