from django.urls import path

from .controller import LoginViewSet
from .controller import RefreshViewSet
from .controller import RegistrationViewSet

urlpatterns = [
    path("login", LoginViewSet, basename="auth-login"),
    path("register", RegistrationViewSet, basename="auth-register"),
    path("refresh", RefreshViewSet, basename="auth-refresh"),
]
