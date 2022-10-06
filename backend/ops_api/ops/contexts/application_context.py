from abc import ABC, abstractmethod

from authlib.integrations.django_client import OAuth
from authlib.jose import jwt


class ApplicationContext:
    appContext = None

    @classmethod
    def register_context(cls, context):
        cls.appContext = context

    @classmethod
    def get_context(cls):
        return cls.appContext


class BaseContext(ABC):
    @abstractmethod
    def get_name(self):
        pass

    @abstractmethod
    def auth_library(self):
        pass

    @abstractmethod
    def jwt_library(self):
        pass

    @abstractmethod
    def auth_controller(self):
        pass


class DeployedContext(BaseContext):
    # TODO Parameterize?
    def auth_library(self):
        oauth = OAuth()
        oauth.register("logingov")
        return oauth.logingov

    def get_name(self):
        return "DeployedContext"

    def jwt_library(self):
        return jwt

    def auth_controller(self):
        pass


class TestContext(BaseContext):
    def get_name(self):
        return "TestContext"

    def auth_library(self):
        oauth = OAuth()
        oauth.register("fake")
        return oauth.fake

    def jwt_library(self):
        return jwt

    def auth_controller(self):
        pass
