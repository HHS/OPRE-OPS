# Continuous deploy flow

This document describes our team's continuous deployment practices and patterns. Over the long run, it should answer these questions:

* [How is code deployed to the development app for testing and initial review?](#how-is-code-deployed-to-the-development-app-for-testing-and-initial-review)
* [How is code deployed to the staging app for further review?](#how-is-code-deployed-to-the-staging-app-for-further-review)
* [How is code deployed to the production app for end users?](#how-is-code-deployed-to-the-production-app-for-end-users)

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

More to come on continuous deploys to prod. In the future, we will likely want deploys to prod to be triggered once a feature branch has been approved by all relevant parties for a prod deploy and merged into a branch like `main`.

## Resources

For more on good continuous deployment practices (including sample CircleCI+cloud.gov config!) — see the [TTS Engineering Practices Guide](https://engineering.18f.gov/continuous-deployment/).
