from ops.models.cans import Agreement
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_agreement_lookup(loaded_db_with_cans):
    agreement = loaded_db_with_cans.session.query(Agreement).get(1)
    assert agreement is not None
    assert agreement.name == "Agreement A11"


def test_agreement_creation():
    agreement = Agreement(name="Agreement-2", agreement_type_id=4)
    assert agreement.to_dict()["name"] == "Agreement-2"
