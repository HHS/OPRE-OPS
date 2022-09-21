from django.urls import path

from .controller import LoginViewSet
from .controller import RefreshViewSet
from .controller import RegistrationViewSet

urlpatterns = [
    path("login", LoginViewSet.as_view({"post": "create"})),
    path("register", RegistrationViewSet.as_view({"post": "create"})),
    path("refresh", RefreshViewSet.as_view({"post": "create"})),
]
