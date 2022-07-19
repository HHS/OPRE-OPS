# 10. Use GitHub Actions for CI/CD

Date: 2022-07-18

## Decision

We will use [GitHub Actions](https://github.com/features/actions) to run our CI/CD processes. 

## Status

Accepted.  Replaces [8. Use CircleCI for Continuous Integration](./deprecated/008-use-circle-for-ci-cd.md).

## Context

The [previous ADR]((./deprecated/008-use-circle-for-ci-cd.md)) mentioned that GitHub Actions is not as mature as
CircleCI.  It is a mature product now.  There is the added benefit of being integrated with
[GitHub, our chosen system for version control](./003-use-github-for-version-control.md).  In addition, there are
[mature tools](https://github.com/nektos/act) to test GitHub actions.

### Related issues

- #304
