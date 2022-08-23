from opre_ops.ops_site.cans.controller import CANFiscalYearSerializer
from opre_ops.ops_site.cans.controller import CommonAccountingNumberSerializer
from opre_ops.ops_site.portfolios.controller import PortfolioSerializer


def test_CAN_serializer_has_depth_of_one():
    assert CommonAccountingNumberSerializer.Meta.depth == 1


def test_CAN_serializer_returns_all_models_fields():
    assert CommonAccountingNumberSerializer.Meta.fields == "__all__"


def test_CAN_fiscal_year_serializer_has_depth_of_one():
    assert CANFiscalYearSerializer.Meta.depth == 1


def test_CAN_fiscal_year_serializer_returns_all_models_fields():
    assert CANFiscalYearSerializer.Meta.fields == "__all__"
