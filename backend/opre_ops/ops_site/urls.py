from django.urls import path

from opre_ops.ops_site.cans.controller import CANFiscalYearByCanListController
from opre_ops.ops_site.cans.controller import CanListController
from opre_ops.ops_site.cans.controller import CanReadController


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
    path(
        "can-fiscal-year/<int:can_id>/<int:fiscal_year>",
        CANFiscalYearByCanListController.as_view(),
    ),
]
