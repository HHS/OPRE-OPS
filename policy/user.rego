package httpapi.authz.user

import future.keywords.contains
import future.keywords.if
import future.keywords.in

default allow := false

public_cert := `-----BEGIN CERTIFICATE-----
MIIDEjCCAfoCCQC1KOagDIVQ5zANBgkqhkiG9w0BAQsFADBLMQswCQYDVQQGEwJV
UzELMAkGA1UECAwCREMxEzARBgNVBAcMCldhc2hpbmd0b24xDDAKBgNVBAoMA0hI
UzEMMAoGA1UECwwDQUNGMB4XDTIyMDkyNzE4MjkzN1oXDTIzMDkyNzE4MjkzN1ow
SzELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAkRDMRMwEQYDVQQHDApXYXNoaW5ndG9u
MQwwCgYDVQQKDANISFMxDDAKBgNVBAsMA0FDRjCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBAMt62RgvgvOX2wUN860ktabUzDXy685dTd4Lgx9n39sDTzlh
XNOfzzF0EITm7lXBSUdaUVS9lMGFXRva1NRb+raYNnZSgSRglFC+oV5NPXhw8K14
nn66ti19E38pFdmdms1UySc2ItgcnfNoN3xqGl/1XMyhaKvWbQVqs/9s5ZOO0wYk
UBBxWQfzqGxKVa/T5EIn/lt7k0p29nm/eE2PwTUYPMFb8brH288R2KhOLJLvpEIm
pCHyVx3dxZG7KTb+8hoDgfCvpjUR5xCBTmq6qIUst6QF8bnW3awJPjP9zRo5GwmA
5ViPfurz/ALcRGFrTwhdovky3rWWUkLuCrkf7KMCAwEAATANBgkqhkiG9w0BAQsF
AAOCAQEAWwy2EvJyYDymg0fWbhupC5I5Duv+kmLI8KV3C8lq2VNjL7MPCZXUtlfc
fIQnRYmhmcecEv7qyh8WciUQe7mn6tkw2w3ToJDKTIl81FDgyyQtdnIokQv7/H+N
vaISuax0LrPNM8yeCjOSBqPeEVp8U+S8k8tvDoFLnYfsqzyH2xJhr8gxhEft4WYS
reOBPaUMVH0k52JLXP/z4pRf19QYv8f07YbAPX7ntdpBiUEj4xcS3JSW5LB9f91T
N6NPb50jM2VBYXv2SUYsmnFuiiMWIbTOszwBffs9AxIeSuq95kAUTWDcnI0wQUTv
IPj6hYX9wVPjJis9My7jCfUbkF9xbg==
-----END CERTIFICATE-----`

# Allow if user endpoint is self
allow if {
	input.method == "GET"
	input.path == ["api", "v1", "users"]
    input.user_id == token.sub
}

# verify token
is_valid_

# # # Helper to get the token payload.
token = {"payload": payload} if {
	io.jwt.verify_rs256(input.token, public_cert)
	[_, payload, _] := io.jwt.decode(input.token)
}
