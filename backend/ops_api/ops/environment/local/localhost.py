from ops_api.ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = True  # make sure DEBUG is off unless enabled explicitly otherwise

# pragma: allowlist secret
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://ops:ops@localhost:5432/postgres"  # pragma: allowlist secret
SQLALCHEMY_ECHO = False

# redirect_uri derives from OPS_FRONTEND_URL (same pattern as environment/azure/preview.py)
# rather than hardcoding localhost:3000, so fakeauth keeps working when FRONTEND_PORT is
# remapped (e.g. by .claude/hooks/assign-dev-ports.sh for parallel worktrees). This does
# NOT fix logingov/hhsams: those external IDPs validate redirect_uri against a value
# pre-registered on their side, which a dynamically-hashed port can't match. To test real
# SSO against them, pin FRONTEND_PORT back to whatever's registered (default 3000) or set
# OPRE_OPS_DISABLE_DEV_PORT_HOOK=1.
AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
        "redirect_uri": OPS_FRONTEND_URL,  # noqa: F405
    },
    "hhsams": {
        "server_metadata_url": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/.well-known/openid-configuration",
        "token_endpoint": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/token",
        "user_info_url": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/userinfo",
        "client_id": "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/token",
        "redirect_uri": OPS_FRONTEND_URL,  # noqa: F405
    },
    "fakeauth": {
        "server_metadata_url": "http://localhost:5000/oidc/.well-known/openid-configuration",
        "token_endpoint": "http://localhost:5000/oidc/openid-connect/token",
        "user_info_url": "http://localhost:5000/oidc/openid-connect/userinfo",
        "client_id": "blah:blah",
        "client_kwargs": {"scope": "openid email"},
        "aud": "http://localhost:5000/oidc/openid-connect/token",
        "redirect_uri": f"{OPS_FRONTEND_URL}/login",  # noqa: F405
    },
}
