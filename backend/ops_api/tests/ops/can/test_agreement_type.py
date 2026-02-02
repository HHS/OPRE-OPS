from models import AgreementType


def test_agreement_type_retrieve_all(loaded_db, app_ctx):
    assert len(AgreementType) == 5
