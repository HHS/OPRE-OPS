# ADR 27: Management of Public Key Infrastructure (PKI)

Date: 10-1-2024

## Status

Accepted

## Context

OPS has public and private key pairs in use as part of its authorization mechanisms.
A standardized mechanism for creating, storing, and referencing those keys is necessary.
We evaluated storing certificates as files and referencing using environment variables and also storing in Azure Vault.

## Decision

OPS will have private and public keys stored in Azure Vault for its environments.

For local development, developers can [create their own key pairs via CLI](../../README.md) using `openssl` and store them in their shell environment.
In Azure, the key pairs can be created using our Terraform IaC.

The relevant key data will be provided into a running container via environment variables.

## Consequences

Key data can be secured using standardized and purpose-built Azure mechanisms and also providing resiliency mechanisms.
This method also keeps key pairs used in persistent running environments out of our codebase, which would then be
distributed in local caches, or any other independent configuration management.
Storing and securing keys in this manner also allows for consistent and secure re-creation and rotation of keys
as the need arises.
