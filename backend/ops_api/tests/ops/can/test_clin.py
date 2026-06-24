from models import CLIN, Agreement, BudgetLineItem


def test_clin_retrieve(loaded_db, app_ctx):
    # Test lazy CLIN creation by creating a BLI with clin_id assignment
    # Get an agreement to attach the BLI to
    agreement = loaded_db.query(Agreement).first()
    assert agreement is not None, "Test requires at least one agreement in test data"

    # Create a test BLI with clin_id to trigger lazy creation
    bli = BudgetLineItem(
        agreement_id=agreement.id,
        can_id=1,  # Assume CAN 1 exists in test data
        amount=1000,
        status="DRAFT",
        clin_id=999  # Assign CLIN number to trigger lazy creation
    )
    loaded_db.add(bli)
    loaded_db.flush()  # Trigger lazy creation

    # Verify CLIN was lazily created
    clin = loaded_db.query(CLIN).filter(
        CLIN.number == 999,
        CLIN.agreement_id == agreement.id
    ).first()
    assert clin is not None, "CLIN should be lazily created when BLI is assigned clin_id"
    assert clin.name == "CLIN 999"


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
