from opre_ops.ops_site.cans.controller import CommonAccountingNumberSerializer


def test_CAN_serializer_has_depth_of_one():
    assert CommonAccountingNumberSerializer.Meta.depth == 1


def test_CAN_serializer_returns_all_models_fields():
    assert CommonAccountingNumberSerializer.Meta.fields == "__all__"
