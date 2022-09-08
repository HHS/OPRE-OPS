#!/usr/bin/env bash

set -eo pipefail

export PYTHONPATH="./:${PYTHONPATH}"

SPACE_NAME=$(echo "${VCAP_APPLICATION}" | jq --raw-output '.space_name')

if [[ "${SPACE_NAME}" == "john.skinner" ]]; then
    # In dev environment, remove test data before running migrations to
    # avoid constraint errors
    python ./ops_api/manage.py custom-flush --allow-cascade --no-input
fi

python ./ops_api/manage.py migrate

if [[ "${SPACE_NAME}" == "john.skinner" ]]; then
    # Load the fake data because we're deploying to the dev environment
    python ./ops_api/manage.py loaddata ./ops_api/ops_site/fixtures/fake_data.json
fi

python -m gunicorn ops_api.django_config.asgi:application --worker-class=uvicorn.workers.UvicornWorker --bind=0.0.0.0:8080
