# Continuous deployment

This document describes our team's continuous deployment practices. Over the long run, it should answer these questions:

* [How will our continuous deployment process work?](#how-will-our-continuous-deployment-process-work)
* [How will we manage access to CircleCI?](#how-will-we-manage-access-to-circleci)
* [What human review steps are required to deploy changes?](#what-human-review-steps-are-required-to-deploy-changes) [more to come here]
* [What automated checks run to verify the quality of new code?](#what-automated-checks-run-to-verify-the-quality-of-new-code) [more to come here]
* [How is code deployed to development for testing and initial review?](#how-is-code-deployed-to-development-for-testing-and-initial-review)
* [How is code deployed to demo for further review?](#how-is-code-deployed-to-demo-for-further-review) [more to come here]
* [How is code deployed to staging?](#how-is-code-deployed-to-staging) [more to come here]
* [How is code deployed to production for end users?](#how-is-code-deployed-to-production-for-end-users) [more to come here]

## How will our continuous deployment process work?

[We decided to use CircleCI](../adr/deprecated/008-use-circle-for-ci-cd.md) for our continuous integration (CI) and continuous deployment (CD) pipelines.

Continuous integration (CI) will let us propose code changes on a consistent basis. Automated tests will run on every pull request, keeping code quality high and checking for regressions.

Continuous deployment (CD) will let us create an automated deployment path, making the release of new code more predictable, easier for developers, and less error-prone than manual deployments. Developers will not need to store credentials on local machines to run deploys, since deploy access will be managed through our CI/CD tool.

Code will graduate from development up to production through the following spaces. Multiple layers of manual human review and multiple layers of automated checks will run regularly throughout the process.

1. Development
2. Demo
3. Staging
4. Production

For more on spaces, see the CloudFoundry documentation: https://docs.cloudfoundry.org/concepts/roles.html#spaces

## How will we manage access to CircleCI?

CircleCI mirrors permissions from GitHub ([docs](https://support.circleci.com/hc/en-us/articles/360034990033-Am-I-an-Org-Admin-)). Access and permissions to CircleCI will be managed via the same processes as access to this GitHub repository. 

## What human review steps are required to deploy changes?

More to come here! This can reference our [issue_review documentation](./issue_review.md).

## What automated checks run to verify the quality of new code?

More to come here! This can reference our ADRs.

## How is code deployed to development for testing and initial review?

We want a development space where:

1. developers can try out new code in a cloud environment after testing it on their local machines, and 
2. our PM can review deployed features
 
Since development is a space for experimental changes, don't count on the development space to always be up and running. However, features in the development space should be in a good state by the time they are submitted for PM review.

For initial development and testing, we are currently using a sandbox on cloud.gov: https://cloud.gov/pricing/.

### Continuous deployment to dev

Unless we create many dev apps and write functionality similar to [Heroku Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps) (one app per in-progress PR), we will only have one dev app for an engineering team of three. How should devs trigger deploys to the dev app?

Our plan is to allow any dev to trigger a deploy to the dev app via a merge to the `development` branch.

Each deploy would overwrite the state of the dev app. Developers should post in Slack to let the team know when they deploy, especially if multiple developers are actively working on features at the same time.

## How is code deployed to demo for further review?

In the future, we want to have a demo space which we will use to demo features that have passed PM review, but still need review from our PO and/or other stakeholders. More to come on continuous deploys to the demo space.

## How is code deployed to staging?

In the future, we want to have a staging space, where we can be confident that anything on there is ready to be pushed to production at any time. Anything on staging has gone through all the necessary layers of review and is ready to deploy to production at any time. More to come on continuous deploys to staging.

## How is code deployed to production for end users?

In the future, we want to have a production app which will store real data and deliver value to real users! More to come on continuous deploys to prod and release management.

## Resources

For more on good continuous deployment practices (including sample CircleCI+cloud.gov config) — see the [TTS Engineering Practices Guide](https://engineering.18f.gov/continuous-deployment/).
