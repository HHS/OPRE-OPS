# 2. Cloud Environment

Date: 2021-06-22

## Status

Accepted

### 2022-07-18 Update

We re-evaluated Cloud.gov.  We have decided to cautiously proceed forward with Cloud.gov.  We will want to integrate
with them as fast as possible to discover any showstoppers quickly.

## Context

We considered three potential cloud environment options to move MAPS into HHS control:

- Cloud.gov
- an AWS instance provided by ACF
- an AWS instance provided by HHS

We know that recent projects at ACF have had success using Cloud.gov. Those projects were able to inherit security controls from Cloud.gov, easing the path to ATO.

Of the options, Cloud.gov:

- provides the most readily accessible public documentation about [how to set up a new environment](https://Cloud.gov/docs/getting-started/accounts/)
- provides the most readily accessible public documentation [which controls can be inherited](https://Cloud.gov/docs/overview/fedramp-tracker/)
- runs in the AWS GovCloud region, providing additional security and compliance benefit

## Decision

Our decision is to use Cloud.gov for OPS.

## Consequences

We predict that using Cloud.gov will ease the ATO process, shortening the timeline to delivery.

We predict that Cloud.gov will reduce burden on developers to manage infrastructure.

We predict that using Cloud.gov may simplify permissions administration, allowing non-software engineers to administer permissions with the Cloud.gov UI.
