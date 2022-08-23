from opre_ops.ops_site.portfolios.controller import PortfolioSerializer


def test_Portfolio_serializer_has_depth_of_one():
    assert PortfolioSerializer.Meta.depth == 1


def test_Portfolio_serializer_returns_all_models_fields():
    assert PortfolioSerializer.Meta.fields == "__all__"
