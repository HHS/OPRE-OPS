from django.urls import path
from opre_ops.ops_site.cans.controller import CANFiscalYearByCanListController
from opre_ops.ops_site.cans.controller import CANFiscalYearListController
from opre_ops.ops_site.cans.controller import CANFiscalYearReadController
from opre_ops.ops_site.cans.controller import CanListController
from opre_ops.ops_site.cans.controller import CanReadController


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
    path("cfys/<int:can_id>", CANFiscalYearByCanListController.as_view()),
    path("cfys/<int:can_id>/<int:fiscal_year>", CANFiscalYearByCanListController.as_view()),
    path("cfys", CANFiscalYearListController.as_view()),
    path("cfy/<int:pk>", CANFiscalYearReadController.as_view()),
]
