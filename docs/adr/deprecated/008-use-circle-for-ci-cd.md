# 8. Use CircleCI for Continuous Integration

Date: 2021-07-19

## Decision

We will use [CircleCI](https://circleci.com/) for our continuous integration (CI) and continuous deployment (CD) pipelines. 

## Status

Superseded.  [11. Use GitHub Actions for CI/CD](../011-github-actions-for-ci-cd.md) is newer. 

## Context and explanation of the tech concepts

We need a tool to power our CI/CD pipelines.

Continuous integration (CI) will let us propose code changes on a consistent basis. Automated tests will run on every pull request, keeping code quality high and checking for regressions.

Continuous deployment (CD) will let us create an automated deployment path, making the release of new code more predictable, easier for developers, and less error-prone than manual deployments.

### Options considered

#### CircleCI

- The Department of Health and Human Services (HHS) owns and operates a CirlceCI organization. This makes CircleCI  a natural choice, because we know it is compliant with HHS standards.
- Several other projects working within the Administration for Children and Families (ACF) are successfully using CircleCI for CI/CD.

#### GitHub Actions

- Using a GitHub tool for CI/CD would have the advantage of reduce the number of third-party tech services we need to manage, since we already plan to use GitHub for source control.
- At this time, GitHub Actions may be a less mature tool than CircleCI. GitHub Actions launched in 2019, whereas CircleCI was founded in 2011.

## Tradeoffs and consequences

We predict that using CircleCI will:

- Provide a stable and mature CI/CD pipeline.
- Allow us to use a tech tool that is well-known to HHS.
- Allow us to share knowledge and potentially even code with other 18F projects at ACF.

## Further reading

- https://circleci.com/
- https://github.com/features/actions

## Related issue

[#55](https://github.com/18F/OPRE-Unicorn/issues/55)  
