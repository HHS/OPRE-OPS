package httpapi.authz

default allow = false

# Allow all users to view all portfolios.
allow {
    some username
    input.method == "GET"
    input.path = ["api", "v1", "portfolios"]
    token.payload.user == username
    user_owns_token
}

# Allow all users to view all CANs.
allow {
    some username
    input.method == "GET"
    input.path = ["api", "v1", "cans"]
    token.payload.user == username
    user_owns_token
}

# Ensure that the token was issued to the user supplying it.
user_owns_token { input.user == token.payload.azp }

# Helper to get the token payload.
token = {"payload": payload} {
  [_, payload, _] := io.jwt.decode(input.token)
}
