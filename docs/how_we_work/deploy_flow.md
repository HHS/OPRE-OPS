# Continuous deployment

This document describes our team's continuous deployment practices. Over the long run, it should answer these questions:

* [How will our continuous deployment process work?](#how-will-our-continuous-deployment-process-work)
* [What human review steps are required to deploy changes?](#what-human-review-steps-are-required-to-deploy-changes) [more to come here]
* [What automated checks run to verify the quality of new code?](#what-automated-checks-run-to-verify-the-quality-of-new-code) [more to come here]
* [How is code deployed to the development space for testing and initial review?](#how-is-code-deployed-to-the-development-space-for-testing-and-initial-review)
* [How is code deployed to the staging space for further review?](#how-is-code-deployed-to-the-staging-space-for-further-review) [more to come here]
* [How is code deployed to the production space for end users?](#how-is-code-deployed-to-the-production-space-for-end-users) [more to come here]

## How will our continuous deployment process work?

[We decided to use CircleCI](../adr/008-use-circle-for-ci-cd.md) for our continuous integration (CI) and continuous deployment (CD) pipelines.

Continuous integration (CI) will let us propose code changes on a consistent basis. Automated tests will run on every pull request, keeping code quality high and checking for regressions.

Continuous deployment (CD) will let us create an automated deployment path, making the release of new code more predictable, easier for developers, and less error-prone than manual deployments. Developers will not need to store credentials on local machines to run deploys, since deploy access will be managed through our CI/CD tool.

Code will graduate from development up to production through the following spaces. Multiple layers of manual human review and multiple layers of automated checks will run regularly throughout the process.

1. Development
2. Staging
3. Production

For more on spaces, see the CloudFoundry documentation: https://docs.cloudfoundry.org/concepts/roles.html#spaces

## What human review steps are required to deploy changes?

More to come here! This can reference our [issue_review documentation](./issue_review.md).

## What automated checks run to verify the quality of new code?

More to come here! This can reference our ADRs.

## How is code deployed to the development space for testing and initial review?

The purpose of a development space is for developers to test out new code. Since it's a place for experimental changes, expect apps in the dev space to be flaky, like a "friend" that never texts you back or like a delicious buttery pastry. Expect it to be buggy, like a July excursion to the swamp or like an entomologist's office. Expect it to be usually up but occasionally down from time to time. 

For initial development and testing, we are currently using a sandbox on cloud.gov: https://cloud.gov/pricing/.

### Continuous deployment to the dev space

Unless we create many dev apps and write functionality similar to [Heroku Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps) (one app per in-progress PR), we will only have one dev app for an engineering team of three. How should devs trigger deploys to the dev app?

Our plan is to allow any dev to trigger a deploy to the dev app via a [git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging). (See ["Executing workflows for a git tag" in the Circle docs](https://circleci.com/docs/2.0/workflows/#executing-workflows-for-a-git-tag).) This will give devs the flexibility to deploy to dev and test out new code at any time, without waiting for a review process or a git merge process. 

Each deploy would overwrite the state of the dev app. Dev should post in Slack to let the team know when they deploy, especially if multiple devs are actively working on features at the same time. 

## How is code deployed to the staging space for further review? 

In the future, we'll have a staging space which we will use to demo features that have passed initial levels of review but haven't been fully approved for delivery to the end users.

More to come on continuous deploys to staging. In the future, we will likely want deploys to be triggered once a feature branch has been approved by all relevant parties for a staging deploy and merged into a branch like `staging`.

## How is code deployed to the production space for end users? 

In the future, we'll have a production app which will store real data and deliver value to real users!

More to come on continuous deploys to prod and release management. 

## Resources

For more on good continuous deployment practices (including sample CircleCI+cloud.gov config) — see the [TTS Engineering Practices Guide](https://engineering.18f.gov/continuous-deployment/).
