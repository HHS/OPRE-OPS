package httpapi.authz
import future.keywords

default allow = false

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "cans"]
}

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "portfolios"]
}

# # Ensure that the token was issued to the user supplying it.
# user_owns_token { input.user == token.payload.sub }

# # Helper to get the token payload.
# token = {"payload": payload} {
#   [_, payload, _] := io.jwt.decode(input.token)
# }
