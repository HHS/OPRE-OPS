# 9. Use GitHub Dependabot and GitHub CodeQL security tools

Date: 2021-07-20

## Decision

We will use GitHub Dependabot to scan our dependencies for vulnerabilites. 

We will use GitHub CodeQL to scan our code for potential vulnerabilities. 

## Status

Accepted

## Context and explanation of the tech concepts

Our project needs security tooling. 

***Dependency scanning***: Alerts developers when one of the libraries we are using needs to be upgraded because of a vulnerability.

***Static analysis***: Scans our code for security issues and anti-patterns.

### Options considered 

#### Snyk

We considered using [Snyk](https://snyk.io/) for dependency scanning, but we observed that other teams had moved away from Snyk, in part because of the complexities of juggling Snyk accounts as team members offboarded and onboarded.

#### GitHub Dependabot 

* In [ADR #3](https://github.com/18F/OPRE-Unicorn/blob/main/docs/adr/003-use-github-for-version-control.md), we decided to use GitHub for version control.
* GitHub also offers a dependency scanning tool called Dependabot, which other 18F teams at ACF are using successfully. 
* We predict that using a built-in GitHub tool for dependency scanning will allow us to configure and maintain the tool with less friction. 

#### GitHub CodeQL

* GitHub offers a static analysis tool called CodeQL, which other 18F teams are using successfully. 
* We predict that using a built-in GitHub tool will allow us to configure and maintain the tool with less friction. 
* We will need to either run CodeQL through an GitHub Actions workflow, or run it in CircleCI. 

### Related issues

* [#36](https://github.com/18F/OPRE-Unicorn/issues/36)
* [#90](https://github.com/18F/OPRE-Unicorn/issues/90)
* [#98](https://github.com/18F/OPRE-Unicorn/issues/98)
