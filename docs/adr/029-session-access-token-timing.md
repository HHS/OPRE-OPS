# 29. Session and access token timings

Date: 2025-01-24

## Status

Accepted

## Context

* The length of a user's authorization/sessions are controlled by compliance controls, such as [AC-12](../Security-Compliance/Security-Controls/ac/ac-12.md)
* With the current behavior of OPS's in-app user notifications, the frontend will be hitting the /notifications endpoint, resulting in a /refresh every minute or so.

* If the value of `USER_SESSION_EXPIRATION` (for idleness) and `JWT_ACCESS_TOKEN_EXPIRES` are set to be the same, in combination with the previous point, a race condition can occur such that a user's access token could chronologically be invalid, expired, and unreadable before OPS can even run any of its checks to determine the validity of the user's session and properly end that session and log the user off and record the event properly. One outcome can be that when the JWT is attempted to be verified, the verification will fail as if the JWT is invalid, which it is at at that time and in that scenario, resulting in an application error/failure. On the contrary, we do in fact  expect this scenario and need better treatment of that scenario.

## Decision

Change `USER_SESSION_EXPIRATION` to be two minutes less than the value of `JWT_ACCESS_TOKEN_EXPIRES`

### Options Considered

* Stagger or alter the timing of `USER_SESSION_EXPIRATION` and `JWT_ACCESS_TOKEN_EXPIRES` such that they are not the same and the user's session can expired before the access token becomes unreadable and invalidated
* Put cleanup, logging functionality, and verifications in an error handler for an invalid JWT
* Refactor JWT verification and saftey mechanisms including order of operations
* Increase the length of time the access token is valid for


## Consequences

Users will only be able to have an idle session for 2 minutes less than the current precribed and configured maximum idle session.

## Related issues

#3302
