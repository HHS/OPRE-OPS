package httpapi.authz
import future.keywords

default allow = false

users := {"jdoe@email.com", "sam.tester@email.com"}

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "cans"]
    is_user
}

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "portfolios"]
    is_user
}

# # Ensure that the token was issued to the user supplying it.
user_owns_token { input.user == token.payload.username }

is_admin {
  data.users[token.payload.email].role == "Admin"
}

is_user {
  data.users[token.payload.email].role in ["Admin", "User"]
}

# # Helper to get the token payload.
token = {"payload": payload} {
  io.jwt.verify_hs256(input.jwt, "secret")
  [header, payload, signature] := io.jwt.decode(input.jwt)
}
