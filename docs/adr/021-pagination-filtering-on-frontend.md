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

## Experiment

Load 20, 500, 1k, 2k, 3k, 5k, 10k, 20k BLIs into cloud.gov development environment and measure the latency and memory utilization of Redux.

### Conclusion

I found that in cloud.gov, an estimated 10 years of BLIs would take approximately 1s to load into Redux and would take approximately 8 MB of memory in the Redux store.

There are currently a lot of unknowns that would affect the assumptions of this experiment, e.g. whether we will still use cloud.gov in the future and if the 664 BLIs from last year are a good approximation for the average number of BLIs per year.

The “Filter time” is the time it takes on the frontend to apply the following filters: filter by Agreement, Need By Date, and BLI Status.  As you can see, the Filter time does not significantly add to the page load time.

If this approach were chosen, I would suggest paginating the BLIs in React to reduce rendering time and improve memory utilization in the DOM.

Also, using different caching and pre-loading techniques could be implemented to further improve the performance.

### Data Collected

Last year there were 664 unique BLIs.

20 BLIs (Default):

Server Response Time: 139 ms DEV, 21 ms LOCAL
Server Response Size: 7 kB
Heap Size: 20 MB
Filter time: 2 ms DEV

500 BLIs:

Server Response Time: 176 ms DEV, 199 ms LOCAL
Server Response Size: 252 kB
Heap Size: 22 MB
Filter time: 2 ms DEV

1000 BLIs:

Server Response Time: 229 ms DEV, 223.3 ms LOCAL
Server Response Size: 500 kB
Heap Size: 23 MB
Filter time: 5 ms DEV

2000 BLIs:

Server Response Time: 318 ms DEV, 270 ms LOCAL
Server Response Size: 1 MB
Heap Size: 24 MB
Filter time: 6 ms DEV

3000 BLIs:

Server Response Time: 524 ms DEV, 475 ms LOCAL
Server Response Size: 1.5 MB
Heap Size: 25 MB
Filter time: 12 ms DEV

5000 BLIs:

Server Response Time: 620 ms DEV, 1s LOCAL
Server Response Size: 2.6 MB
Heap Size: 28 MB
Filter time: 15 ms DEV

10000 BLIs:

Server Response Time: 1.3 s DEV, 3.4s LOCAL
Server Response Size: 5.1 MB
Heap Size: 31 MB
Filter time: 30 ms DEV

20000 BLIs:

Server Response Time: 2.7s DEV, 7.6s LOCAL
Server Response Size: 10.2 MB
Heap Size: 34.4 MB
Filter time: 53 ms DEV

## Decision

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
