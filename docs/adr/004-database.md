
# 4. Database 

Date: 2021-06-25

## Status

Proposed

## Context

We want to pick a database for Unicorn development.

We will likely need a relational database since the data is mostly structured and related.

Reference to [different types of databases and their usages](https://www.geeksforgeeks.org/types-of-databases/).

## Decision

We will use PostgreSQL database for Unicorn.

## Consequences

PostgreSQL is an open source database that is cheaper to maintain compare to other non-open source database like Oracle.

[PostgresSQL is a default datastore selection at TTS](https://engineering.18f.gov/datastore-selection/) to allow learning and sharing best practices with other projects.
