# Identification and Authentication
## IA-05-01 - Authenticator Management | Password-based Authentication

For password-based authentication:
(a) Maintain a list of commonly-used, expected, or compromised passwords and update the list [Assignment: organization-defined frequency] and when organizational passwords are suspected to have been compromised directly or indirectly;<br />
(b) Verify, when users create or update passwords, that the passwords are not found on the list of commonly-used, expected, or compromised passwords in IA-5(1)(a);<br />
(c) Transmit passwords only over cryptographically-protected channels;<br />
(d) Store passwords using an approved salted key derivation function, preferably using a keyed hash;<br />
(e) Require immediate selection of a new password upon account recovery;<br />
(f) Allow user selection of long passwords and passphrases, including spaces and all printable characters;<br />
(g) Employ automated tools to assist the user in selecting strong password authenticators; and<br />
(h) Enforce the following composition and complexity rules: [Assignment: organization-defined composition and complexity rules].<br />

## OPS Implementation

TODO: inherit from OPS Oauth provider for all sub-parts

### Related Content

* [IA-6](../ia-06/index.md)
