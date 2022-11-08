from abc import ABC
from abc import abstractclassmethod

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
    @abstractclassmethod
    def get_name(cls):  # noqa: B902
        pass

    @abstractclassmethod
    def auth_library(cls):  # noqa: B902
        pass

    @abstractclassmethod
    def jwt_library(cls):  # noqa: B902
        pass

    @abstractclassmethod
    def auth_controller(cls):  # noqa: B902
        pass


class DeployedContext(BaseContext):
    # TODO Parameterize?
    @classmethod
    def auth_library(cls):
        oauth = OAuth()
        oauth.register("logingov")
        return oauth.logingov

    @classmethod
    def get_name(cls):
        return "DeployedContext"

    @classmethod
    def jwt_library(cls):
        return jwt

    @classmethod
    def auth_controller(cls):
        pass


class TestContext(BaseContext):
    @classmethod
    def get_name(cls):
        return "TestContext"

    @classmethod
    def auth_library(cls):
        oauth = OAuth()
        oauth.register("fake")
        return oauth.fake

    @classmethod
    def jwt_library(cls):
        return jwt

    @classmethod
    def auth_controller(cls):
        pass
