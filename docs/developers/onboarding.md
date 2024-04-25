# Welcome to OPRE OPS!

Welcome aboard! We're excited to have you as part of our team. This guide is designed to help you get started with our project infrastructure and set up your development environment. Please follow the steps outlined below and let us know if you have any questions.

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Setup](#repository-setup)
- [FrontEnd Development](#frontend-development)
- [BackEnd Development](#backend-development)
- [DevOps Practices](#devops-practices)
- [Additional Resources](#additional-resources)
- [Getting Help](#getting-help)

## Project Overview

Brief description of what the project is about, its goals, and how it fits into the larger picture of the company's objectives.

## Repository Setup

The OPS project is hosted in two separate repositories.  Both repositories are hosted on GitHub.

* [OPRE-OPS](https://github.com/HHS/OPRE-OPS) - The primary application.
* [OPRE-OPS-Data](https://github.com/HHS/OPRE-OPS-Data) - IaC and scripts for the data migration.

The system is deployed from the `main` branch of the `OPRE-OPS` repository.
When you are ready to contribute, please create a new branch from `main` and submit a pull request.
The branch should be named according to the issue you are working on, e.g. `OPS-XXXX-task-1` or `OPS-XXXX/task-1`.

## FrontEnd Development

The front-end of the application is built using React.

You will want to familiarize yourself with the following tools and libraries:
* [React](https://react.dev/)
* [React Router](https://reactrouter.com/)
* [React Redux](https://react-redux.js.org/)
* [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
* [Axios](https://axios-http.com/)
* [Cypress](https://docs.cypress.io/guides/overview/why-cypress)
* [Jest](https://jestjs.io/)
* [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
* [USWDS](https://designsystem.digital.gov/)

## BackEnd Development

The back-end of the application is built using Flask.

You will want to familiarize yourself with the following tools and libraries:
* [Flask](https://flask.palletsprojects.com/en/2.0.x/)
* [SQLAlchemy](https://www.sqlalchemy.org/)
* [Alembic](https://alembic.sqlalchemy.org/en/latest/)
* [Marshmallow](https://marshmallow.readthedocs.io/en/stable/)
* [Pytest](https://docs.pytest.org/en/6.2.x/)
* [Flask JWT Extended](https://flask-jwt-extended.readthedocs.io/en/stable/)
* [PostgreSQL](https://www.postgresql.org/)

## DevOps Practices

The project uses GitHub Actions for CI/CD.  The workflows are defined in the `.github/workflows` directory.
The IaC for the project is defined using Terraform.
The project is deployed to Azure using Container Instances.

The local development environment is defined using Docker Compose.
You may need to install Docker Desktop to run the application locally.
The `docker-compose.yml` file defines the services needed to run the application locally.

You will want to familiarize yourself with the following tools and libraries:
* [GitHub Actions](https://docs.github.com/en/actions)
* [Terraform](https://www.terraform.io/)
* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* [Azure Container Instances](https://learn.microsoft.com/en-us/azure/?product=containers)

## Additional Resources

Some additional resources that may be helpful to you as you get started:
* [Flask Mega-Tutorial](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world)
* [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/index.html)
* [React Tutorial](https://react.dev/learn)

## Getting Help
