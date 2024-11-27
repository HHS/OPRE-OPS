from flask import Config

from ops_api.ops.auth.authentication_provider.authentication_provider import AuthenticationProvider


class FakeAuthProvider(AuthenticationProvider):
    def __init__(
        self,
        provider_name: str,
        config: Config,
    ) -> None:
        self.provider_name = provider_name
        self.config = config

        self.fakeUsers = {
            "system_owner": {
                "given_name": "System",
                "family_name": "Owner",
                "email": "system.owner@email.com",
                "sub": "00000000-0000-1111-a111-000000000018",
            },
            "budget_team": {
                "given_name": "Budget",
                "family_name": "Team",
                "email": "budget.team@email.com",
                "sub": "00000000-0000-1111-a111-000000000021",
            },
            "division_director": {
                "given_name": "Dave",
                "family_name": "Director",
                "email": "dave.director@email.com",
                "sub": "00000000-0000-1111-a111-000000000020",
            },
            "basic_user": {
                "given_name": "User",
                "family_name": "Demo",
                "email": "user.demo@email.com",
                "sub": "00000000-0000-1111-a111-000000000019",
            },
        }

    def authenticate(self, auth_code):
        # This simply simulates authenticating to an OIDC provider, by returning the auth_code as the token
        # This uses the auth_code to lookup the user details in the get_user_info method
        # This is only for testing purposes
        return {"access_token": auth_code}

    def get_user_info(self, token):
        return self.fakeUsers[token]

    def validate_token(self, token):
        return True
