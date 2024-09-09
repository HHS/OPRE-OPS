import pytest

from models import AgreementType


@pytest.mark.usefixtures("app_ctx")
def test_agreement_type_retrieve_all(loaded_db):
    assert len(AgreementType) == 6
