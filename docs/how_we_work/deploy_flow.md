# Continuous deployment

This document describes our team's continuous deployment practices. Over the long run, it should answer these questions:

* [How will our continuous deployment process work?](#how-will-our-continuous-deployment-process-work)
* [What human review steps are required to deploy changes?](#what-human-review-steps-are-required-to-deploy-changes) [more to come here]
* [What automated checks run to verify the quality of new code?](#what-automated-checks-run-to-verify-the-quality-of-new-code) [more to come here]
* [How is code deployed to the development app for testing and initial review?](#how-is-code-deployed-to-the-development-app-for-testing-and-initial-review)
* [How is code deployed to the staging app for further review?](#how-is-code-deployed-to-the-staging-app-for-further-review) [more to come here]
* [How is code deployed to the production app for end users?](#how-is-code-deployed-to-the-production-app-for-end-users) [more to come here]

## How will our continuous deployment process work?

[We decided to use CircleCI](../adr/008-use-circle-for-ci-cd.md) for our continuous integration (CI) and continuous deployment (CD) pipelines.

Continuous integration (CI) will let us propose code changes on a consistent basis. Automated tests will run on every pull request, keeping code quality high and checking for regressions.

Continuous deployment (CD) will let us create an automated deployment path, making the release of new code more predictable, easier for developers, and less error-prone than manual deployments. Developers will not need to store credentials on local machines to run deploys, since deploy access will be managed through our CI/CD tool.

Code will graduate from development up to production through the following stages. Multiple layers of manual human review and multiple layers of automated checks will run regularly throughout the process.

1. Development
2. Staging
3. Production

## What human review steps are required to deploy changes?

More to come here!

## What automated checks run to verify the quality of new code?

More to come here!

## How is code deployed to the development app for testing and initial review?

For initial development and testing, we are currently using a sandbox app on cloud.gov.

The purpose of a development app is for developers to test out new code. Since it's a place for experimental changes, expect the dev app to be flaky, like a "friend" that never texts you back or like a delicious buttery pastry. Expect it to be buggy, like a July excursion to the swamp or like an entomologist's office. Expect it to be usually up but occasionally down from time to time. 

### Continuous deployment to the dev app

Unless we create many dev apps and write functionality similar to [Heroku Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps) (one app per in-progress PR), we will only have one dev app for an engineering team of three. How should devs trigger deploys to the dev app?

Our plan is to allow any dev to trigger a deploy to the dev app via a [git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging). (See ["Executing workflows for a git tag" in the Circle docs](https://circleci.com/docs/2.0/workflows/#executing-workflows-for-a-git-tag).) 

This would let any dev trigger a deploy to the dev app via our continuous deployment tooling whenever they like. Each deploy would overwrite the state of the dev app. Dev should post in Slack to let the team know when they deploy, especially if multiple devs are actively working on features at the same time.

## How is code deployed to the staging app for further review? 

In the future, we'll have a staging app which we will use to demo features that have passed initial levels of review but haven't been fully approved for delivery to the end users.

More to come on continuous deploys to staging. In the future, we will likely want deploys to be triggered once a feature branch has been approved by all relevant parties for a staging deploy and merged into a branch like `staging`.

## How is code deployed to the production app for end users? 

In the future, we'll have a production app which will store real data and deliver value to real people!

More to come on continuous deploys to prod and release management. 

## Resources

For more on good continuous deployment practices (including sample CircleCI+cloud.gov config!) — see the [TTS Engineering Practices Guide](https://engineering.18f.gov/continuous-deployment/).
