# OPRE OPS
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

This is the OPRE's Research Portfolio Management System, or OPS. The finished product will replace OPRE's prior system,
[MAPS](https://github.com/HHS/MAPS-app). The purpose of OPS can be found on
[the wiki](https://github.com/HHS/OPRE-OPS/wiki).

## Dependencies

At a bare minimum, you need [Docker](https://www.docker.com) installed to run the application locally.  If you want to do
development, you will also need to install [Python](https://www.python.org), [Node.js](https://nodejs.org), and
[pre-commit](https://pre-commit.com/#installation).

## Install

### Backend

We use [pipenv](https://pipenv.pypa.io) to manage our Python dependencies.  Follow the directions on their website to
install it on your machine.

To install the dependencies, run...

```shell
cd ./backend/
pipenv install --dev
```

### Frontend

We use [yarn](https://yarnpkg.com) to manage our Node.js dependencies.  It comes by default with Node.js.

To install the dependencies, run...

```shell
cd ./frontend/
yarn install
```

## Run

We have a Docker Compose configuration that makes it easy to run the application.

```shell
docker compose up
```

To create an admin user, use the Django management tool from within the container.

```shell
docker compose exec backend python ./opre_ops/manage.py createsuperuser
```

## Access

Whether you run the application through Docker or locally, you can access the frontend at `http://localhost:3000` and
the backend at `http://localhost:8080`.

There remains an administrative interface for the backend that you can access at `http://localhost:8080/admin/`

## Checks

### Unit Tests

#### Backend

TBD.  Pytest, etc.

#### Frontend

The frontend tests are implemented through [Jest](https://jestjs.io).

To run them...

```shell
cd ./frontend/
yarn test --watchAll=false
```

This runs them once and then exits.  You can remove the `--watchAll=false` if you want to continually rerun the tests
on each file save.

You can also get code coverage information by running...

```shell
cd ./frontend/
yarn test:coverage --watchAll=false
```

We require 90% code coverage.

### End-to-end Tests

TBD.

### Linting

#### Backend

The backend linting is implemented using [flake8](https://flake8.pycqa.org).  We use [nox](https://nox.thea.codes) as
the runner to execute `flake8`.

To run linting...

```shell
cd ./backend/
pipenv run nox -s lint
```

The linter may complain about violations in the [Black](https://black.readthedocs.io) code formatting.  To automatically
fix these issues, run...

```shell
cd ./backend/
pipenv run nox -s black
```

#### Frontend

The frontend linting is implemented through [ESLint](https://eslint.org).

To run linting...

```shell
cd ./frontend/
yarn lint
```

You can automatically fix many linting errors by passing in `--fix`.

```shell
cd ./frontend/
yarn lint --fix
```

### Pre-commit Hooks

We use pre-commit hooks to help keep our code clean.  If you develop for OPS, you must install them.

```shell
pre-commit install
```

These checks will run automatically when you try to make a commit.  If there is a failure, it will prevent the commit
from succeeding.  Fix the problem and try the commit again.

## Deployment

This application is deployed to [Cloud.gov](https://cloud.gov) through [Cloud Foundry](https://www.cloudfoundry.org)
though a [manifest.yml](manifest.yml) file.

For now, while we are waiting for full Cloud.gov access, we only have access to a development space.  Eventually, we
will have a staging and production environment.

### Development Environment

The development environment is deployed at https://opre-ops-frontend-test.app.cloud.gov

This environment can be deployed to by anyone with write access to the repository.  You accomplish this by force pushing
an existing commit to the `development` branch.

```shell
git branch -d development  # deletes the development branch if it was already checked out locally
git checkout -b development
git push --force --set-upstream origin development
```

### Staging Environment

TBD.

### Production Environment

TBD.

## Data Model

The data model diagram below shows all the tables used by the application and  relationships between those tables.
Lines between tables mean they are related.  If a line has a circle on one end, that means the table _without a circle_
has a one-to-many relationship with the table _with a circle_ (modeled with a foreign key from the circle-table to the
not-circle-table).  If a line has circles on both ends, the tables have a many-to-many relationship (modeled with
mapping/cross-reference tables).

![the data model](docs/models.png)

This diagram is also available as a [DOT file](docs/models.dot) (DOT is a
[graph description language](https://en.wikipedia.org/wiki/DOT_(graph_description_language)).  It can be used to
represent graph relationships in plain text).  To update this visualization, first use the django-extensions module to
create a new DOT file.

```shell
cd ./backend/
DJANGO_SETTINGS_MODULE=opre_ops.django_config.settings.local PYTHONPATH=. \
  pipenv run python ./opre_ops/manage.py graph_models -a \
  -X LogEntry,AbstractUser,Permission,Group,User,ContentType,AbstractBaseSession,Session \
  > ../docs/models.dot
```

Then use graphviz to convert the dotfile to a PNG image:

```shell
docker run -it --rm -v "$(pwd)/docs":/work -w /work fgrehm/graphviz \
  dot -Tpng models.dot -omodels.png
```
