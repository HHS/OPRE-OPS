from ops.models.cans import FundingSource
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_funding_source_lookup(loaded_db_with_cans):
    funding_source = (
        loaded_db_with_cans.session.query(FundingSource).filter(FundingSource.id == 1).one()
    )
    assert funding_source is not None
    assert funding_source.id == 1
    assert funding_source.name == "Funding-Source-1"
    assert funding_source.nickname == "FS1"
    assert funding_source.cans != []  # CAN(#1) was assigned this funding source


def test_finding_source_creation():
    funding_source = FundingSource(name="Funding-Source-3", nickname="FS3")
    assert funding_source.to_dict()["name"] == "Funding-Source-3"
