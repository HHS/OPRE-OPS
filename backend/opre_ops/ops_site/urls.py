from django.urls import path

from ops_site.cans.controller import CanListController, CanReadController
from ops_site.views import CANInfoDetailView
from ops_site.views import CANInfoListView
from . import views


urlpatterns = [
    path("cans", CanListController.as_view()),
    path("cans/<int:pk>", CanReadController.as_view()),
    # old views
    path("view/home", views.home),
    path("view/cans/", CANInfoListView.as_view()),
    path("view/cans/<int:pk>/", CANInfoDetailView.as_view(), name="can-detail"),
]
