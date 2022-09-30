from django.urls import path

from ops_api.ops.cans.controller import (
    BudgetLineItemListController,
    CANFiscalYearByCanListController,
)
from ops_api.ops.cans.controller import CanListController
from ops_api.ops.cans.controller import CanReadController
from ops_api.ops.portfolios.controller import PortfolioListController
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
    path("budget-line-items", BudgetLineItemListController.as_view()),
]
