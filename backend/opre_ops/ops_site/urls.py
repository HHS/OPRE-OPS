from opre_ops.ops_site.cans.controller import CanListController, CanReadController

from django.urls import path


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
]
