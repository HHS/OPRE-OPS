# 10. Use GitHub Actions for CI/CD

Date: 2022-07-26

## Decision

We will use [Pre-Commit] to implement pre-commit hooks for the repository. This can be used for many security and linting checks, but more importantly will be a core piece for performing secret scanning.

## Status

Accepted. Will be used alongside other pipeline workflow tools, like Github Actions

## Context

The existence of other pipeline workflows like Github Actions, ensures the ability to run many tools like Security checks and Linters. Howerver these are too late in the pipeline to check for certain things which we'd rather not end up in the repository at all, not even accidentally. For this reason, we've decided to implement local pre-commit hooks to check for things like Secrets scanning ([detect-secrets](https://github.com/ibm/detect-secrets)). This won't be limited to only secrets scanning, but that was the core driver. In addition, ensuring  that we run formatting, and linting tools locally, early and often ensures the code base maintains a common standard and format that all developers can rely on.

### Related issues

- #333
