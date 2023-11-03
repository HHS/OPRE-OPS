# 24. HHS AMS (AuthN)

Date: 2023-08-23

## Status

Accepted

## Context

The Department of Health and Human Services (HHS) operates an Access Management System (AMS) that is a FedRAMP moderate approved multifactor authentication and identity management platform. AMS is the prescribed authentication provider of choice for HHS/ACF offices such as OPRE. Supporting both OpenID and SAML, we've opted to use OpenID. The data flow is visualized below.

A core aspect of AMS is native support for PIV/CAC cards for 2FA (Two-Factor Authentication).

## Decision

HHS AMS will be used as the central AuthN Provider for user authentication for OPS.

## Diagram

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Web as OPS Web
    participant API as OPS API
    participant AMS as AMS

    User ->>+ Web: User visits OPS Web
    Web ->> Web: Check if OPS JWT exists

    User ->>+ Web: User Clicks Login Button if no active JWT
    User ->>+ AMS: User is redirected to AMS
    AMS ->>- Web: On login success, Auth Code is returned to OPS Web
    Web ->>+ API: Sends Auth Code to OPS API (Backend)
    API ->>+ AMS: Backend wraps the Auth Code in JWT, requests Auth Token
    AMS ->> AMS: Validate Auth Code
    AMS ->>- API: Auth Token is returned (JWT)
    API ->> API: Validate Auth Token JWT
    API ->> API: User Lookup / Creation (within OPS) - Grab details as needed.
    API ->>- Web: New JWT is created and returned with "Session" / User Data
```

### Related issues

#447 and #1206
