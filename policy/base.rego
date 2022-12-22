package httpapi.authz

import future.keywords

default allow = false

allow if {
	input.method == "GET"
	input.path == ["api", "v1", "cans"]
	user_owns_token
}

allow if {
	input.method == "GET"
	input.path == ["api", "v1", "portfolios"]
  user_owns_token
}

allow if {
	input.method == "GET"
	input.path == ["api", "v1", "admin"]
	is_admin
}

# # Ensure that the token was issued to the user supplying it.
user_owns_token if input.user == token.payload.username

is_admin if {
	data.users[claims.payload.username].role in admin_roles
}

is_user if {
  print(claims.payload)
	data.users[claims.payload.username].role in all_roles
}

all_roles := {"Admin", "User"}

admin_roles := {"Admin"}

# # Helper to get the token payload.
token = {"payload": payload} if {
	io.jwt.verify_hs256(input.jwt, "secret")
	[_, payload, _] := io.jwt.decode(input.jwt)
}

claims := payload if {
	v := input.attributes.request.http.headers.authorization
	startswith(v, "Bearer ")
	t := substring(v, count("Bearer "), -1)
	io.jwt.verify_hs256(t, "secret")
	[_, payload, _] := io.jwt.decode(t)
}
