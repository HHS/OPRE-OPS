from ops_api.ops.auth.oidc import OidcController
from ops_api.ops.auth.oidc import get_jwt



def test_get_jwt():
    jws = get_jwt()
    assert jwx != None
