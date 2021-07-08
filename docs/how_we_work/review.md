# Review

In addition to code review, the product manager (PM) will review proposed changes in order to:

* make sure that submitted work matches the issue and meets acceptance criteria
* check for quality and make sure there aren't any regressions
* make sure that she can speak confidently and accurately to the state of the product

All pull requests (PRs) will need to be approved by at least two other team members besides the author: 

* another engineering team member
* the PM

The only type of PR that may or may not need PM review are for security controls. The table below summarizes: 

Type of PR | Reviews required
--- | --- 
New features | Engineering review + PM review
[ADR](docs/adr/001-record-architecture-decisions.md) | Engineering review + PM review
Bug fixes | Engineering review + PM review
Refactors | Engineering review + PM review
Documentation | Engineering review + PM review
Security controls | TBD

We still need to determine the role of the system's product owner (PO) in the review process and the right granularity for her review.
