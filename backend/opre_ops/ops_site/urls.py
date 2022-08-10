from django.urls import path
from opre_ops.ops_site.cans.controller import CanListController, CANFiscalYearByCanListController, CanReadController, CANFiscalYearListController, CANFiscalYearReadController


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
    path("cfys/<int:can_id>", CANFiscalYearByCanListController.as_view()),
    path("cfys/<int:can_id>/<int:fiscal_year>", CANFiscalYearByCanListController.as_view()),
    path("cfys", CANFiscalYearListController.as_view()),
    path("cfy/<int:pk>", CANFiscalYearReadController.as_view()),
]
