# 22. Cloud Environment

Date: 2023-09-15

## Status

Accepted

## Context

After much discussion and evaluation, [a decision was reached to dispense with the use of Cloud.gov](./deprecated/002-use-cloud-dot-gov.md) and a new cloud hosting environment was needed.

## Options Considered

We considered and evaluated three mainstream "hyperscaler" cloud providers: AWS, Azure, and GCP. All three options have similar technical capabilities and compliance postures. Each one was evaluated for both technical and non-technical factors.

## Decision

Our decision is to proceed with using Microsoft Azure for OPS.

## Consequences

We predict that we will be able to take advantage of the mature and growing ecosystem of Azure products and services and reduce or eliminate the potential to develop any homegrown services.

We predict that there may potentially be opportunities to leverage synergy with use of existing Office365 or Azure tooling that OPRE already uses today with tooling that may be in use at a future time within OPS hosted in Azure.
