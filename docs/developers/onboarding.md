# Welcome to OPRE OPS!

Welcome aboard! We're excited to have you as part of our team. This guide is designed to help you get started with our project infrastructure and set up your development environment. Please follow the steps outlined below and let us know if you have any questions.

## Table of Contents

- [Project Overview](#project-overview)
- [Software Development Practices](...)
- [Repository Setup](#repository-setup)
- [FrontEnd Development](#frontend-development)
- [BackEnd Development](#backend-development)
- [DevOps Practices](#devops-practices)
- [Additional Resources](#additional-resources)
- [Getting Help](#getting-help)

## Project Overview

OPS is the OPRE Portfolio management System. It is a new system currently being designed and developed.

OPS will empower managers and staff with the visibility they need into OPRE’s research, evaluation, and data activities, as well as streamline budget and administrative tasks. With this system, it will be easy for OPRE to plan and manage projects so they can spend less time managing the work and more time building evidence to improve the lives of children and families.

- read more on the [wiki](https://github.com/HHS/OPRE-OPS/wiki/01-Background-and-introduction)

## Software Development Practices

Software Engineering at Flexion is guided by OESA (Option Enabling Software Architecture).
There is an OESA workshop that you can attend to learn more about the principles and practices.

OESA is partly based on [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
and [SOLID](https://www.freecodecamp.org/news/solid-design-principles-in-software-development/) principles of object-oriented design.

Some reference materials that may be helpful to you as you get started:

- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) by Robert C. Martin
- [Clean Architecture](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) by Robert C. Martin
- [Refactoring](https://www.amazon.com/Refactoring-Improving-Existing-Addison-Wesley-Signature/dp/0134757599) by Martin Fowler
- [Domain-Driven Design](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215) by Eric Evans
- [The Pragmatic Programmer](https://www.amazon.com/Pragmatic-Programmer-Journeyman-Master/dp/020161622X) by Andrew Hunt and David Thomas
- [Continuous Delivery](https://www.amazon.com/Continuous-Delivery-Deployment-Automation-Addison-Wesley/dp/0321601912) by Jez Humble and David Farley
- [Modern Software Engineering](https://www.amazon.com/Modern-Software-Engineering-Discipline-Development/dp/0137314914/) by Dave Farley

## Repository Setup

The OPS project is hosted in two separate repositories.  Both repositories are hosted on GitHub.

- [OPRE-OPS](https://github.com/HHS/OPRE-OPS) - The primary application.
- [OPRE-OPS-Data](https://github.com/HHS/OPRE-OPS-Data) - IaC and scripts for the data migration.

The system is deployed from the `main` branch of the `OPRE-OPS` repository.
When you are ready to contribute, please create a new branch from `main` and submit a pull request.
The branch should be named according to the issue you are working on, e.g. `OPS-XXXX-task-1` or `OPS-XXXX/task-1`.

## FrontEnd Development

The front-end of the application is built using [React](https://react.dev/).

You will want to familiarize yourself with the following tools and libraries:
- [React](https://react.dev/)
  - The library for web and native user interfaces
  - [Official React Tutorial](https://react.dev/learn)
  - [Joy of React](https://www.joyofreact.com) course by Josh W Comeau [paid]
  - [React - The Complete Guide 2024 (incl. React Router & Redux)](https://www.udemy.com/course/react-the-complete-guide-incl-redux/) by Academind [paid]
  - [Delightful React File/Directory Structure](https://www.joshwcomeau.com/react/file-structure/)
- [React Router](https://reactrouter.com/)
  -  Framework that lets us handle client and server-side routing in React applications
- [React Redux](https://react-redux.js.org/)
  - Official React bindings for Redux
  - Official [Tutorials Overview](https://redux-toolkit.js.org/tutorials/overview)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
  - The official, opinionated, batteries-included toolset for efficient Redux development
- [Axios](https://axios-http.com/)
  - Promise based HTTP client for the browser and node.js
- [Cypress](https://docs.cypress.io/guides/overview/why-cypress)
  - Next generation front end testing tool built for the modern web.
  - [Real World Testing with Cypress](https://learn.cypress.io) course
  - [Cypress End-to-End Testing - Getting Started](https://www.udemy.com/course/cypress-end-to-end-testing-getting-started/) by Academind [paid]
- [Jest](https://jestjs.io/)
  - JavaScript Testing Framework with a focus on simplicity
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
  - Light-weight solution for testing React components
  - [Testing Javascript course](https://www.testingjavascript.com) by Kent C. Dodds [paid]
  - [React Testing Library Tutorial](https://www.robinwieruch.de/react-testing-library/) by Robin Wieruch
  - more [Learning Material](https://testing-library.com/docs/learning/)
- [U.S. Web Design System (USWDS)](https://designsystem.digital.gov/)
  - A design system for the federal government
  - A [tutorial project](https://github.com/uswds/uswds-tutorial) to learn about installing, compiling, and customizing with USWDS
- [Vest](https://vestjs.dev)
  - Declarative validations framework inspired by unit testing libraries
- [CSS Modules](https://github.com/css-modules/css-modules)
  - CSS file where all class names and animation names are scoped locally by default
- [Vite](https://vitejs.dev)
  - Next Generation Frontend Tooling
  - Learn Vite – [Frontend Build Tool Course](https://youtube.com/watch?v=VAeRhmpcWEQ)
  - FrontEnd Masters Course on [Vite](https://frontendmasters.com/courses/vite/) [paid]

Helpful browser extensions:
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools/tree/main/extension#installation)
- Clear Browsing Data
- Measure-it
- WAVE Evaluation Tool

## BackEnd Development

The back-end of the application is built using Flask.

You will want to familiarize yourself with the following tools and libraries:
- [Flask](https://flask.palletsprojects.com/en/2.0.x/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Alembic](https://alembic.sqlalchemy.org/en/latest/)
- [Marshmallow](https://marshmallow.readthedocs.io/en/stable/)
- [Pytest](https://docs.pytest.org/en/6.2.x/)
- [Flask JWT Extended](https://flask-jwt-extended.readthedocs.io/en/stable/)
- [PostgreSQL](https://www.postgresql.org/)

## DevOps Practices

The project uses GitHub Actions for CI/CD.  The workflows are defined in the `.github/workflows` directory.
The IaC for the project is defined using Terraform.
The project is deployed to Azure using Container Apps.

The local development environment is defined using Docker Compose.
You may need to install Docker Desktop to run the application locally.
The `docker-compose.yml` file defines the services needed to run the application locally.

You will want to familiarize yourself with the following tools and libraries:
- [GitHub Actions](https://docs.github.com/en/actions)
- [Terraform](https://www.terraform.io/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)

## Additional Resources

Some additional resources that may be helpful to you as you get started:
- [Flask Mega-Tutorial](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/index.html)

## Getting Help
- Join a pairing session on team calendar
- Ping team engineering Slack channel `acf-opre-ops-engineer-discuss`
- Ping team members on Slack
