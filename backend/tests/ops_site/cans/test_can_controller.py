from opre_ops.ops_site.cans.controller import CANFiscalYearSerializer
from opre_ops.ops_site.cans.controller import CANSerializer


def test_CAN_serializer_has_depth_of_one():
    assert CANSerializer.Meta.depth == 1


def test_CAN_serializer_returns_all_models_fields():
    assert CANSerializer.Meta.fields == "__all__"


def test_CAN_fiscal_year_serializer_has_depth_of_one():
    assert CANFiscalYearSerializer.Meta.depth == 1


def test_CAN_fiscal_year_serializer_returns_all_models_fields():
    assert CANFiscalYearSerializer.Meta.fields == "__all__"
