# 21. Pagination/Filtering On Frontend

Date: 2023-10-24

## Status
Accepted

## Context

Establish any guidelines to help in determining whether we should load all the BLIs into Redux in one backend call or whether to make multiple paginated calls to the API.

If it is possible to load all the BLIs at once there are at least 2 advantages:

1. Filtering/Sorting/Searching would be fast
2. There would be less calls to the API (reduced load and latency)

The concern is whether a representative data set would fit into Redux without problems and how long the initial load of the BLIs would take.

## Decision

John DeAngelis conducted performance tests documented here: https://docs.google.com/document/d/1hMxrv-Zhv_xu2E0tTMzRdNTiD1M-GjCg1x2tVVJ4DKI/edit?usp=sharing

The results of the tests show that loading all the BLIs at once is not a problem. The initial load of the BLIs takes about 1 second. Filtering/Sorting/Searching is fast.

A poll was taken of the team and the consensus was to load all the BLIs at once (vote was 3-2).
For those who voted against, we will revisit this decision if we encounter performance problems in the future.
As a possible future remediation, we could move a filter to the backend or use defaults to limit the data initially loaded.

## Pros
- Filtering/Sorting/Searching would be fast
- There would be less calls to the API (reduced load and latency)

## Cons
- Solution is not as scalable.

## Consequences
- We predict that loading all the BLIs into the frontend will reduce latency and improve the user experience.

## Links
- https://docs.google.com/document/d/1hMxrv-Zhv_xu2E0tTMzRdNTiD1M-GjCg1x2tVVJ4DKI/edit?usp=sharing
