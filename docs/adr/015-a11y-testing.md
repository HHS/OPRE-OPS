# 15. Accessibility (a11y) Testing

Date: 2022-09-13

## Decision

A11y is important.  To ensure OPS is accessible, we will use [aXe](https://github.com/dequelabs/axe-core) in
[combination](https://www.npmjs.com/package/cypress-axe) with [Cypress](https://www.cypress.io) to do a11y testing.
We will strive to a11y test every view of OPS.  We will accomplish this by inlining a11y checks in our existing
end-to-end tests.

## Status

Accepted.

## Context

A11y is important.  Not only that, it is mandated by federal law.

[aXe](https://www.deque.com/axe/) is a major player in the a11y testing and training.  They make an open-source tool
called axe-core that we'll be utilizing through Cypress.  That makes it easy to a11y test because Cypress is...

- Adept at interacting and navigating websites to get them into all the different states that need to be a11y tested.
- Already used for our [end-to-end testing](./014-use-cypress-for-testing.md).

We're using aXe because it...

- Finds more a11y issues than [pa11y](https://pa11y.org) and other tools.
- Has the most active development.
- Goes above and beyond our client-required standards of [section 508](https://www.section508.gov) and [WCAG](https://www.w3.org/TR/WCAG20/) compliance.
- Integrates nicely with our existing end-to-end testing.  There doesn't seem to be a way to use pa11y with Cypress.
  Instead, it seems that one needs to use pa11y's custom navigation language.

With that said, there are some issues that only pa11y finds.  In the future, we can revisit this and see if the calculus
has changed such that we want to integrate pa11y or some other tool.

### Related issues

#376.
