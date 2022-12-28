package httpapi.authz

import future.keywords.contains
import future.keywords.if
import future.keywords.in

default allow := false


# Allow if user endpoint is self
allow if {
	input.method == "GET"
	input.path == ["api", "v1", "users"]
	input.user_id == token.sub
}

# verify token

# # # Helper to get the token payload.
token = {"payload": payload} if {
	io.jwt.verify_hs256(input.token, "this-should-be-secret")
	[_, payload, _] := io.jwt.decode(input.token)
}
