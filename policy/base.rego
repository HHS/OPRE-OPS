package httpapi.authz
import future.keywords

default allow = false

users := {"jdoe@email.com", "sam.tester@email.com"}

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "cans"]
}

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "portfolios"]
    input.user in users
}

# # Ensure that the token was issued to the user supplying it.
user_owns_token { input.user == token.payload.username }

# # Helper to get the token payload.
token = {"payload": payload} {
  [_, payload, _] := io.jwt.decode(input.token)
}
