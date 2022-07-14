
# 4. Database 

Date: 2021-07-07

## Status

Accepted

## Context

We want to pick a persistent storage mechanism for OPS development.

We will likely need a relational database since the data is mostly structured and related.

Reference to [different types of databases and their usages](https://www.geeksforgeeks.org/types-of-databases/).

## Options Considered

We considered a few factors when we pick a database:
- since the data is relational, we need a relational database
- cost of owning
- recommended solutions from [TTS Engineering Practices](https://engineering.18f.gov/)

These factors lead us to an open source relational database, and a [recommended selection at TTS -- PostgreSQL](https://engineering.18f.gov/datastore-selection/).

## Decision

We will use PostgreSQL database for OPS.

## Consequences

PostgreSQL is an open source database that is cheaper to maintain compare to other non-open source database like Oracle.

[PostgresSQL is a default datastore selection at TTS](https://engineering.18f.gov/datastore-selection/) to allow learning and sharing best practices with other projects.
