from django.urls import path

from ops_api.ops.auth.oidc import OidcController
from ops_api.ops.cans.controller import CANFiscalYearByCanListController
from ops_api.ops.cans.controller import CanListController
from ops_api.ops.cans.controller import CanReadController
from ops_api.ops.portfolios.controller import (
    PortfolioFundingView,
    PortfolioListController,
)
from ops_api.ops.portfolios.controller import PortfolioReadController


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
    path(
        "can-fiscal-year/<int:can_id>/<int:fiscal_year>",
        CANFiscalYearByCanListController.as_view(),
    ),
    path("portfolios", PortfolioListController.as_view()),
    path("portfolios/<int:pk>", PortfolioReadController.as_view()),
    path("portfolios/<int:pk>/calcFunding", PortfolioFundingView.as_view()),
    path("auth/authenticate", OidcController.as_view()),
]
