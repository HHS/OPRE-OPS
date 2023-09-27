
# 23. Document Storage

Date: 2023-09-13

## Status

Accepted

## Context

We need a document storage system for OPS because it needs to store documents and objects such as pre and post-award agreement documentation and invoices.

### Explanation of the tech concept
Document storage system is a system that stores application content.  The content can be files of different sizes and formats.

### Options Considered

We did not consider options other than Azure Blob Storage.  This decision is driven by [our cloud environment choice](./022-use-azure.md) of using Microsoft Azure. Azure Blob Storage is a service available native to Azure and requires no additional procurement or external provisioning.


## Decision

We will use Azure Blob Storage as our document storage system.

## Consequences

Using Azure Blob Storage will allow us to:
- Scale easily to fit the amount of storage the application needs
- Access the content reliably
- Set up versioning and backup of the content
- Protect content from unauthorized access

## Further reading

+ https://azure.microsoft.com/en-us/products/storage/blobs
