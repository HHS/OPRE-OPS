from abc import ABC, abstractmethod

from flask import current_app
from models.users import User
from sqlalchemy import select


class AuthorizationProvider(ABC):
    @abstractmethod
    def is_authorized(self, user_id: str, permission: list[str]):
        pass


class BasicAuthorizationPrivider(AuthorizationProvider):
    def __init__(self, authirized_users: list[str] = []):
        self.authorized_users = authirized_users

    def is_authorized(self, oidc_id: str, permissions: list[str]) -> bool:
        stmt = select(User).where(User.oidc_id == oidc_id)
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            user = users[0][0]

            for role in user.roles:
                for permission in permissions:
                    if permission in role.permissions:
                        return True

        return False


class OAuthAuthorizationProvider(AuthorizationProvider):
    def __init__(self, oauth_client_id: str, oauth_client_secret: str):
        self.oauth_client_id = oauth_client_id
        self.oauth_client_secret = oauth_client_secret

    def is_authorized(self, oidc_id: str, permission: list[str]) -> bool:
        # This could be used if we end up rolling our own OAuth Provider
        # Use the OAuth client ID and secret to check if the user is authorized
        # using the appropriate API calls.
        return True


class OpaAuthorizationProvider(AuthorizationProvider):
    def __init__(self, policy: str, opa_url: str = ""):
        self.policy = policy
        self.opa_url = opa_url

    def is_authorized(self, oidc_id: str, permission: list[str]) -> bool:
        # Make a call to the OPA API, passing along the policy you want to
        # check against
        # TODO: implement me
        return True


class AuthorizationGateway:
    """
    Authoriztion Gateway for easily swapping out different Authorization Providers

    :usage init:
        auth_gateway = AuthorizationGateway(BasicAuthorizationPrivider())

    :usage authorize:
        if auth_gateway.authorize(user_id, permission):
            #allowed access
    """

    def __init__(self, authorization_provider: AuthorizationProvider) -> None:
        """
        Create the AuthorizationGateway instance. You can either pass a flask application
        in directly here to register this extension with the flask app, or
        call init_app after creating this object (in a factory pattern).

        :param authorization_provider:
            The Authorization Provider class to use
        """
        self.authorization_provider = authorization_provider

    def is_authorized(self, oidc_id, permission):
        return self.authorization_provider.is_authorized(oidc_id, permission)

    def authorize(self, oidc_id: str, permission: list[str]) -> bool:
        """
        Will do a lookup based on the provided oidc_id, and check whether that
        user's role contains those permissions.
        For now this is simply a basic string lookup/comparison.

        Args:
            oidc_id (str): User OIDC_ID (sub from JWT)
            permission (list[str]): list of strings, for the allowed permissions

        Returns:
            bool: Basic pass/fail check.
        """
        if not self.is_authorized(oidc_id, permission):
            # TODO Perform a logging action, so we can audit this invalid
            # authorization attempt somewhere.
            # raise ValueError("User is not authorized")
            return False
        # If the user is authorized, do any necessary authorization tasks here
        # For example, logging the user in, setting session data, etc.
        # ...

        # Return a success message
        # print(f"User {oidc_id} has been authorized for {permission}")
        return True
