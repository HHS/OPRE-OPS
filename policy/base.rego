package httpapi.authz

default allow = true

# # Allow all users to view all endpoints.
# allow {
#     some username
#     input.method == "GET"
#     input.path = ["api", "v1",]
#     token.payload.email == username
#     user_owns_token
# }

# # Ensure that the token was issued to the user supplying it.
# user_owns_token { input.user == token.payload.sub }

# # Helper to get the token payload.
# token = {"payload": payload} {
#   [_, payload, _] := io.jwt.decode(input.token)
# }
