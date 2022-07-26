# 10. Use Renovatebot for Dependency Updates

Date: 2022-07-18

## Decision

We will use Renovatebot to keep our dependencies up to date.

## Status

Accepted

## Context and explanation of the tech concepts

Dependencies are updated all the time.  It is good hygiene to keep these dependencies up to date.
This way you get all bug fixes and improvements.
The more you get behind, the more risky an update to the latest becomes.

We will automerge minor and patch versions.  Major versions will not be automatically merged because, ostensibly, they
contain breaking changes and should be manually reviewed by a human.

## Options considered

### Renovatebot

- Renovatebot has many more ways to configure it than Dependabot.
- We have had success using it in other projects.
- It has wide support for many different package systems.

### GitHub Dependabot

- In [ADR #9](./009-use-github-dependabot-and-codeql.md), we decided to use GitHub Dependabot for dependency vulnerability scanning.
- It's a first class tool used in GitHub.

## Related issues

- #304
