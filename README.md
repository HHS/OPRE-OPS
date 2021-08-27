# OPRE OPS

## Getting Started
### Running the Application locally

Application built using [pack Buildpack CLI](https://github.com/buildpacks/pack) and runs within Docker.

Instructions to start app locally:

1. Make sure you have Docker installed and started locally
2. Make sure you have pack installed, see [this link](https://buildpacks.io/docs/tools/pack/) for instructions

From the project root run:

```
docker-compose build
docker-compose up
```

Then navigate to http://localhost:8080 in your browser

### Dependency management with pipenv

To install `Pipfile` requirements locally run:
```
pipenv install
```

To activate the virtual environment run:
```
pipenv shell
```

To install a new package into the `[packages]` in the `Pipfile` run:
```
pipenv install <package-name>
```

this will also update the `Pipfile.lock`

To install a new package into the `[dev-packages]` in the `Pipfile` run:
```
pipenv install --dev <package-name
```

this will also update the `Pipfile.lock`

To uninstall a package from the `Pipfile` run:
```
pipenv uninstall <package-name>
```

this will also remove it from the `Pipfile.lock`
