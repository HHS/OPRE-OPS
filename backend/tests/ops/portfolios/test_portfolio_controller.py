from ops_api.ops.portfolios.controller import PortfolioSerializer


def test_Portfolio_serializer_has_depth_of_one():
    assert PortfolioSerializer.Meta.depth == 1


def test_Portfolio_serializer_returns_all_models_fields():
    assert PortfolioSerializer.Meta.fields == "__all__"


def test_Portfolio_serializer_returns_cans_fields():
    portfolio_serializer_fields = PortfolioSerializer().get_fields()

    assert "cans" in portfolio_serializer_fields
    assert portfolio_serializer_fields["cans"] is not None
