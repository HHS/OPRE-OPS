import pytest
from models.cans import AgreementType


@pytest.mark.usefixtures("app_ctx")
def test_agreement_type_retrieve_all(loaded_db):
    agreement_type = loaded_db.session.query(AgreementType).all()
    assert len(agreement_type) == 5


@pytest.mark.parametrize(
    "id,name",
    [
        (1, "Contract"),
        (2, "Grant"),
        (3, "Direct Allocation"),
        (4, "IAA"),
        (5, "Miscellaneous"),
    ],
)
@pytest.mark.usefixtures("app_ctx")
def test_agreement_type_lookup(loaded_db, id, name):
    agreement_type = loaded_db.session.query(AgreementType).get(id)
    assert agreement_type.name == name
