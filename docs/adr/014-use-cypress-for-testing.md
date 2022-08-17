# 14. Use Cypress for Testing

Date: 2022-08-17

## Decision

We will use [Cypress](https://docs.cypress.io/guides/overview/why-cypress), and the other accompanying parts, to implement the different Testing needs (End-2-End, Visual Regression, etc.).

## Status

Accepted.

## Context

Cypress is a next generation front end testing tool built for the modern web.

We're still using language specific tests for unit testing (pytest, jest), but for more advanced testing needs Cypress will be utilized.

- It allows for easy browser based testing.
- Native support for screenshots and video.
- Network traffic control (can be userful for performance testing).
- Direct React Component support.

### Related issues

- #304
