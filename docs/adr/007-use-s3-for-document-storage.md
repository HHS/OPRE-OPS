
# 7. Document Storage

Date: 2021-07-14

## Status

Proposed

## Context

We need a document storage system for Unicorn because it needs to store documents and objects such as invoices, and contracts.

### Explanation of the tech concept
Document storage system is a system that stores application content.  The content can be files of different sizes and formats. 

### Options Considered 

We did not considered options other than Amazon S3.  This decision is driven by our cloud environment choice of using cloud.gov.  S3 is a tool available within cloud.gov and any other choice will require additional procurement.

## Decision

We will use Amazon Simple Storage Service (Amazon S3) as our document storage system. 

## Consequences

Using Amazon S3 will allow us to:
- Scale easily to fit the amount of storage the application needs
- Access the content reliably
- Set up versioning and backup of the content
- Protect content from unauthorized access

## Further reading

+ https://aws.amazon.com/s3/
