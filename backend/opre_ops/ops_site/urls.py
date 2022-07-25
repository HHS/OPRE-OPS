from django.urls import path

from ops_site.cans.controller import CanListController, CanReadController


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
]
