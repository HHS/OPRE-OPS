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
    def get_name():
        pass
    
    @abstractmethod
    def auth_library():
        pass
    
    @abstractmethod
    def jwt_library():
        pass
    
    @abstractmethod
    def auth_controller():
        pass


class DeployedContext(BaseContext):
    ## TODO Parameterize?
    def auth_library():
        oauth = OAuth()
        oauth.register("logingov")
        return oauth.logingov
    
    def get_name():
        return "DeployedContext"
    
    def jwt_library():
        return jwt

    def auth_controller():
        pass

class TestContext(BaseContext):
    def get_name():
        return "TestContext"
    
    def auth_library():
        oauth = OAuth()
        oauth.register("fake")
        return oauth.fake

    def jwt_library():
        return jwt

    def auth_controller():
        pass