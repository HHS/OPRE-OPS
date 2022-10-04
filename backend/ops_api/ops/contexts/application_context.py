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


class DeployedContext:
    ## TODO Parameterize?
    def auth_library():
        oauth = OAuth()
        oauth.register("logingov")
        return oauth.logingov

    def jwt_library():
        return jwt


class TestContext:
    def auth_library():
        oauth = OAuth()
        oauth.register("logingov")
        return oauth.logingov

    def jwt_library():
        return jwt
