from django.http import HttpRequest
from rest_framework.request import Request

from ops_api.ops.auth.oidc import get_jwt
from ops_api.ops.auth.oidc import OidcController
from ops_api.ops.contexts.application_context import ApplicationContext, TestContext


ApplicationContext.register_context(TestContext)

def test_get_jwt_has_a_value():
    jws = get_jwt()
    assert jws != None

def test_auth_post_fails():
    data = '{"code":"abc1234"}'
    http_req = HttpRequest()
    http_req.path = "http://localhost:8080/auth"
    http_req.method = "POST"
    http_req.data = data
    req = Request(request=http_req)
    #req = Request("POST","http://localhost:8080/auth",data=data,json=data)
    res = OidcController.post(req)
    assert res == "There was an error."