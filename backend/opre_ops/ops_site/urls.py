from django.urls import path

from ops_site.views import CANInfoDetailView
from ops_site.views import CANInfoListView
from . import views


urlpatterns = [
    path("home", views.home),
    path("cans/", CANInfoListView.as_view()),
    path("cans/<int:pk>/", CANInfoDetailView.as_view(), name="can-detail"),
]
