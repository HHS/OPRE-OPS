from django.urls import path
from . import views

from ops_site.views import CANInfoListView
from ops_site.views import CANInfoDetailView

urlpatterns = [
    path("home", views.home),
    path("cans/", CANInfoListView.as_view()),
    path("cans/<int:pk>/", CANInfoDetailView.as_view(), name="can-detail"),
]
