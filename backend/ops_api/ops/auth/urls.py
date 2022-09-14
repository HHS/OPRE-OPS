from django.urls import path
from django.conf.urls import include, url

from .controller import LoginViewSet
from .controller import RegistrationViewSet
from .controller import RefreshViewSet

urlpatterns = [
    path("login", LoginViewSet, basename="auth-login"),
    path("register", RegistrationViewSet, basename="auth-register"),
    path("refresh", RefreshViewSet, basename="auth-refresh")
]
