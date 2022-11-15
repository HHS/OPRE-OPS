from ops.can.models import AgreementType
import pytest


def test_agreement_type_retrieve_all(db_session, init_database, db_tables):
    agreement_type = db_session.query(AgreementType).all()
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
def test_agreement_type_lookup(db_session, init_database, db_tables, id, name):
    agreement_type = db_session.query(AgreementType).get(id)
    assert agreement_type.name == name
