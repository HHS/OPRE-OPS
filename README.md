# OPRE OPS

This is a prototpye of OPRE's research Portfolio management System, or **OPS**. The finished product will replace OPRE's prior system, MAPS, which [is archived here](https://github.com/HHS/MAPS-app). The purpose of OPS can be found on [the wiki](https://github.com/HHS/OPRE-OPS/wiki).

Technologies used in this prototype:
* Python
* Django 4.0
* PostgreSQL
* Cloud.gov
* CircleCI

## Getting Started

### Running the Application locally

Application built using python Docker image and runs within Docker.

Make sure you have Docker installed and started locally

From the project root run:

```
docker-compose build
docker-compose up
```

Then navigate to http://localhost:8080 in your browser

To create an admin user, use the Django management tool from within the container:

```
docker-compose exec web python manage.py createsuperuser
```

### Dependency management with pipenv

To verify pipenv is installed and working locally, run:
```
pipenv graph
```

If it is not installed, you can install it with:
```
pip3 install pipenv
```
You may have to install Python 3.9 and may have to update your system's PATH to get pipenv working.

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
docker-compose run web pytest --cov-config=.coveragerc --cov=ops_site --cov-report term-missing
```
## Deployment

Prototype deployed at https://opre-ops-test.app.cloud.gov/admin

**Warning:** This prototype uses `runserver` as a web server, which is considered insecure
for production use. This should be replaced with something like `gunicorn` and
`nginx` before it is deployed beyond prototyping purposes.

OPS is deployed:
* as a [Cloud.gov application](https://dashboard.fr.cloud.gov/applications)
* backed by a [Cloud.gov database service](https://dashboard.fr.cloud.gov/services)
* via [CircleCI](https://app.circleci.com/pipelines/github/HHS/OPRE-OPS)

When this CI/CD pipeline is configured and running, deployment happens automatically any time a pull request to the development branch is merged.

To set up or modify the CI/CD pipeline, ensure you:
* have a Cloud.gov app named `opre-ops-test`
* have a service named `opre-ops-psql-db`
* conntect the app and service with `cf bind-service opre-ops-test opre-ops-psql-db`
* [configure the connection to CircleCI](https://github.com/HHS/OPRE-OPS/blob/main/docs/recipes/setup_circleci.md)

## Data model

![OPRE prototype data model](docs/models.png)

To update this visualization, use the django-extensions module to create a new
dotfile:

```sh
docker-compose run web \
  python manage.py \
  graph_models \
  -a \
  -X LogEntry,AbstractUser,Permission,Group,User,ContentType,AbstractBaseSession,Session \
  > docs/models.dot
```

Then use graphviz to convert the dotfile to a PNG image:

```
docker run -it --rm -v "$(pwd)":/work -w /work \
  fgrehm/graphviz \
  dot -Tpng docs/models.dot -odocs/models.png
```