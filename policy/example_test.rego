package example.authz

import future.keywords.contains
import future.keywords.if
import future.keywords.in

default allow := true

# # Allow admins to do anything.
# allow if user_is_admin
# allow if {
# 	input.method == "GET"
# 	input.path == ["api", "v1", "cans"]
# 	user_owns_token
# 	is
# }
# allow if {
# 	input.method == "GET"
# 	input.path == ["api", "v1", "portfolios"]
# 	user_owns_token
# }
# allow if {
# 	input.method == "GET"
# 	input.path == ["api", "v1", "admin"]
# 	is_admin
# }
# allow if {
# 	input.method == "GET"
# 	input.path == ["api", "v1"]
# }
# # # Ensure that the token was issued to the user supplying it.
# user_owns_token if input.user == claims.payload.username
# is_admin if {
# 	data.policy.users[claims.payload.username].role in admin_roles
# }
# # user_is_admin is true if "admin" is among the user's roles as per data.user_roles
# user_is_admin if "admin" in data.user_roles[input.user]
# is_user if {
# 	print(claims.payload)
# 	data.policy.users[claims.payload.username].role in all_roles
# }
# all_roles := {"Admin", "User"}
# admin_roles := {"Admin"}
# # # Helper to get the token payload.
# token = {"payload": payload} if {
# 	io.jwt.verify_hs256(input.jwt, "secret")
# 	[_, payload, _] := io.jwt.decode(input.jwt)
# }
# claims := payload if {
# 	v := input.attributes.request.http.headers.authorization
# 	startswith(v, "Bearer ")
# 	t := substring(v, count("Bearer "), -1)
# 	io.jwt.verify_hs256(t, "secret")
# 	[_, payload, _] := io.jwt.decode(t)
# }
