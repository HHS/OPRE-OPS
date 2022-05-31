from django.urls import path
from . import views

from ops_site.views import CANInfoListView

urlpatterns = [
    path('home', views.home),
    path('cans/', CANInfoListView.as_view()),
]
