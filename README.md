# OPRE OPS

## Getting Started
### Running the Application locally

Application built using python Docker image and runs within Docker.

Instructions to start app locally:

1. Make sure you have Docker installed and started locally

From the project root run:

```
docker-compose build
docker-compose up
```

Then navigate to http://localhost:8080 in your browser

### Dependency management with pipenv

To install a new package into the `[packages]` in the `Pipfile` run:
```
pipenv install <package-name>
```

this will also update the `Pipfile.lock`

To install a new package into the `[dev-packages]` in the `Pipfile` run:
```
pipenv install --dev <package-name>
```

this will also update the `Pipfile.lock`

To uninstall a package from the `Pipfile` run:
```
pipenv uninstall <package-name>
```

this will also remove it from the `Pipfile.lock`

## Running the tests

To run the test locally, run:
```
docker-compose run web pytest --cov-config=.coveragerc --cov=ops_site ops_site/tests/ --cov-report term-missing
```
