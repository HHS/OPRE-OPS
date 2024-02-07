# 9. Use GitHub Dependabot and GitHub CodeQL security tools

Date: 2021-07-20

## Decision

We will use GitHub Dependabot to scan our dependencies for vulnerabilities.

We will use GitHub CodeQL to scan our code for potential vulnerabilities.

## Status

Accepted

## Context and explanation of the tech concepts

Our project needs security tooling.

***Dependency vulnerability scanning***: Alerts developers when one of the libraries we are using needs to be upgraded because of a vulnerability.
This isn't to be confused with dependency updates as new versions are released.

***Static analysis***: Scans our code for security issues and anti-patterns.

### Options considered

#### Snyk

We considered using [Snyk](https://snyk.io/) for dependency scanning, but we observed that other teams had moved away from Snyk, in part because of the complexities of juggling Snyk accounts as team members offboarded and onboarded.

#### GitHub Dependabot

* In [ADR #3](003-use-github-for-version-control.md), we decided to use GitHub for version control.
* GitHub also offers a dependency scanning tool called Dependabot, which other 18F teams at ACF are using successfully.
* We predict that using a built-in GitHub tool for dependency scanning will allow us to configure and maintain the tool with less friction.

#### GitHub CodeQL

* GitHub offers a static analysis tool called CodeQL, which other 18F teams are using successfully.
* We predict that using a built-in GitHub tool will allow us to configure and maintain the tool with less friction.
* We will run CodeQL through a GitHub Actions workflow.

### Related issues
