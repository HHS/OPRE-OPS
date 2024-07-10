# OPRE OPS

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

This is the OPRE Portfolio Management System, or OPS. The finished product will replace OPRE's prior system,
[MAPS](https://github.com/HHS/MAPS-app). The purpose of OPS can be found on
[the wiki](https://github.com/HHS/OPRE-OPS/wiki).

## Dependencies

At a bare minimum, you need [Docker](https://www.docker.com) and
[Docker Compose](https://docs.docker.com/compose/install/) installed to run the application locally. If you want to do
development, you will also need to install [Python](https://www.python.org), [Node.js](https://nodejs.org), and
[pre-commit](https://pre-commit.com/#installation).

## Install

### Backend

We use [pipenv](https://pipenv.pypa.io) to manage our Python dependencies. Follow the directions on their website to
install it on your machine.

To install the dependencies, run...

```shell
cd ./backend/
pipenv install --dev
```

### Frontend

We use [bun](https://bun.sh/docs) to manage our Node.js dependencies.

To install the dependencies, run...

```shell
cd ./frontend/
bun install
```

## Run

We have a Docker Compose configuration that makes it easy to run the application.

To run the application using the vite development server (allows hot reloading)...

```shell
docker compose up --build
```

To run the application using the production server configuration...

```shell
docker compose up db data-import backend frontend-static --build
````

To run the application using the minimal initial data set...

```shell
  docker compose --profile data-initial up --build
```


## Access

Whether you run the application through Docker or locally, you can access the frontend at `http://localhost:3000` and
the backend api at `http://localhost:8080`.

## Checks

### Unit Tests

#### Backend

The backend api utilizes `pytest`.

To run them...

```shell
cd ./backend/ops_api
pytest
```

Note: All backend API endpoints have the ability to simulate an error response, for testing purposes for the frontend. This is accomplished
through passing the `simulatedError=true` query parameter. It will automatically return a status code of 500 whenever this is done. It can
be customized further by choosing the status code and passing that, so `simulatedError=400` sends back a 400 code rather than a 500 code. This will override any other processing the endpoint would normally do and just return the response, giving a simple mechanism for frontend development and/or testing to validate it works with error conditions from the backend.

#### Frontend

The frontend tests are implemented through [Vitest](https://vitest.dev/).

To run them...

```shell
cd ./frontend/
bun run test --watch=false
```

This runs them once and then exits. You can remove the `--watch=false` if you want to continually rerun the tests
on each file save.

You can also get code coverage information by running...

```shell
cd ./frontend/
bun run test:coverage --watch=false
```

We require _90%_ code coverage.

### End-to-end Tests

Note: Currently E2E tests require you to have a local stack running for Cypress to connect to.
This can be achieved by running the `docker-compose.yml` via `docker compose`.

```shell
docker compose up --build
```

End-to-end (E2E) can be run from the `frontend` via:

```shell
bun run test:e2e
```

or Interactively via:

```shell
bun run test:e2e:interactive
```

The E2E uses it's own TEST keys for generating and validating JWT Signatures, as it bypasses any live OAuth providers.
The test-private-key is currently configured within the `cypress.config.js` directly (base64url encoded). The `backend`, then requires the test-public-key in order to validate the signatures of the JWT. This is configured within the `/ops/environment/local/e2e.py` (path); which points to the `/static/test-public-key.pem`.

These keys are ONLY used for End-to-end testing, and are not pushed to any LIVE system outside of local testing.

### Linting

#### Backend

The backend linting is implemented using [flake8](https://flake8.pycqa.org). We use [nox](https://nox.thea.codes) as
the runner to execute `flake8`.

To run linting...

```shell
cd ./backend/ops_api
pipenv run nox -s lint
```

The linter may complain about violations in the [Black](https://black.readthedocs.io) code formatting. To automatically
fix these issues, run...

```shell
cd ./backend/ops_api
pipenv run nox -s black
```

If you're running within a `pipenv shell`, you may ommit the `pipenv run` prefix and run the commands as `nox -s <command>`.

#### Frontend

The frontend linting is implemented through [ESLint](https://eslint.org).

To run linting...

```shell
cd ./frontend/
bun run lint
```

You can automatically fix many linting errors by passing in `--fix`.

```shell
cd ./frontend/
bun run lint --fix
```

### Pre-commit Hooks

We use pre-commit hooks to help keep our code clean. If you develop for OPS, you must install them.

```shell
pre-commit install
```

These checks will run automatically when you try to make a commit. If there is a failure, it will prevent the commit
from succeeding. Fix the problem and try the commit again.

## Deployment

TBD

### Development Environment

TBD

~~This environment can be deployed to manually as well by authorized committers in the repository. You accomplish this by force pushingan existing commit to the `development` branch.~~

```shell
git branch -d development  # deletes the development branch if it was already checked out locally
git checkout -b development
git push --force --set-upstream origin development
```

### Staging Environment

TBD

~~This environment can be deployed to by authorized committers in the repository. You accomplish this by force pushing an existing commit to the `staging` branch.~~

```shell
git branch -d staging  # deletes the staging branch if it was already checked out locally
git checkout -b staging
git push --force --set-upstream origin staging
```

### Production Environment

TBD

## Data Model

TBD

With the move away from Django, we need to create a new process/tooling for generating the Data Model diagrams from SQLAlchemy or directly from the DB.

## SQLAlchemy DB Schema Migrations with Alembic

When updating the SQLAlchemy models, you will need to generate a new migration script for the database schema. This is
done using [Alembic](https://alembic.sqlalchemy.org/en/latest/).

First start the DB and update it to the latest version...

```shell
docker compose up db data-import --build
```

To generate a new migration script, run...

```shell
cd ./backend/
alembic revision --autogenerate -m "Your migration message here"
```

This will create a new migration script in the `./backend/alembic/versions` directory. Review the script to
ensure it is doing what you expect. If it is, you can apply the migration to the database by running...

```shell
cd ./backend/
alembic upgrade head
```

If you need to rollback the migration, you can do so by running...

```shell
cd ./backend/
pipenv run alembic downgrade -1
```
