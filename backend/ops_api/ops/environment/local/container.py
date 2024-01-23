from ops_api.ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = True  # make sure DEBUG is off unless enabled explicitly otherwise

# pragma: allowlist secret
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://ops:ops@db:5432/postgres"  # pragma: allowlist secret
SQLALCHEMY_ECHO = False

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "token_endpoint": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "redirect_uri": "http://localhost:3000/login",
    },
    "hhsams": {
        "server_metadata_url": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/.well-known/openid-configuration",
        "token_endpoint": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/token",
        "user_info_url": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/userinfo",
        "client_id": "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/token",
        "redirect_uri": "http://localhost:3000/login",
    },
    "fakeauth": {
        "server_metadata_url": "http://localhost:5000/oidc/.well-known/openid-configuration",
        "token_endpoint": "http://localhost:5000/oidc/openid-connect/token",
        "user_info_url": "http://localhost:5000/oidc/openid-connect/userinfo",
        "client_id": "blah:blah",
        "client_kwargs": {"scope": "openid email"},
        "aud": "http://localhost:5000/oidc/openid-connect/token",
        "redirect_uri": "http://localhost:3000/login",
    },
    "azureb2c": {
        "server_metadata_url": "https://opreops.b2clogin.com/opreops.onmicrosoft.com/B2C_1_OPRE-OPS-FLEXION-SIGN-IN/v2.0/.well-known/openid-configuration",
        "token_endpoint": "https://opreops.b2clogin.com/opreops.onmicrosoft.com/b2c_1_opre-ops-flexion-sign-in/oauth2/v2.0/token",
        "user_info_url": "",
        "client_id": "3948e2a2-f0ea-444c-9ebc-c40c1de66698",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://opreops.b2clogin.com/opreops.onmicrosoft.com/b2c_1_opre-ops-flexion-sig",
        "redirect_uri": "http://localhost:3000/login",
    },
}
