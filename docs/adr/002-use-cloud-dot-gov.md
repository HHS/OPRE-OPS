# 2. Cloud Environment 

Date: 2021-06-22

## Status

Accepted

## Context

We considered three potential cloud environment options to move MAPS into HHS control: 

* cloud.gov
* an AWS instance provided by ACF
* an AWS instance provided by HHS

We know that recent projects at ACF have had success using cloud.gov. Those projects were able to inherit security controls from cloud.gov, easing the path to ATO. 

Of the options, cloud.gov:

* provides the most readily accessible public documentation about [how to set up a new environment](https://cloud.gov/docs/getting-started/accounts/)
* provides the most readily accessible public documentation [which controls can be inherited](https://cloud.gov/docs/overview/fedramp-tracker/)
* runs in the AWS GovCloud region, providing additional security and compliance benefit

## Decision

Our decision is to use cloud.gov for MAPS.

## Consequences

We predict that using cloud.gov will ease the ATO process, shortening the timeline to delivery.

We predict that cloud.gov will reduce burden on developers to manage infrastructure.

We predict that using cloud.gov may simplify permissions administration, allowing non-software engineers to administer permissions with the cloud.gov UI. 
