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
* http://localhost:8080/ops/cans/ for the OPS site interface
* http://localhost:8080/admin/ for the administrative interface

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

When this CI/CD pipeline is configured and running, [deployment happens automatically any time a pull request to the development branch is merged](https://github.com/HHS/OPRE-OPS/blob/deployment_in_readme/docs/how_we_work/deploy_flow.md).

To set up or modify the CI/CD pipeline, ensure you:
* have a Cloud.gov app named `opre-ops-test`
* have a service named `opre-ops-psql-db`
* conntect the app and service with `cf bind-service opre-ops-test opre-ops-psql-db`
* [configure the connection to CircleCI](https://github.com/HHS/OPRE-OPS/blob/main/docs/recipes/setup_circleci.md)
* [configure egress](https://cloud.gov/docs/management/space-egress/). You may need to run `cg bind-security-group trusted_local_networks_egress [org] --space [space]` to allow the app to reach the database.
* run `cf restage opre-ops-test` after making configuration changes

## Data model

The data model diagram below shows all of the tables used by OPS and
relationships between those tables. Lines between tables mean they are related.
If a line has a circle on one end, that means the table ***without a circle***
has a one-to-many relationship with the table ***with a circle*** (modeled with
a foreign key from the circle-table to the not-circle-table). If a line
has circles on both ends, the tables have a many-to-many relationship (modeled
with mapping/cross-reference tables).

![OPRE prototype data model](docs/models.png)

This diagram is also available as a [DOT file](docs/models.dot). (DOT is a
[graph description
language](https://en.wikipedia.org/wiki/DOT_(graph_description_language)). It
can be used to represent graph relationships in plain text.) To update this
visualization, first use the django-extensions module to create a new
DOT file:

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
docker run -it --rm -v "$(pwd)/docs":/work -w /work \
  fgrehm/graphviz \
  dot -Tpng models.dot -omodels.png
```

(No, there should not be a space between `-o` and `models.png`. It might work
with a space, but the official documentation smooshes them together, so we
documented it that way here.)