#!/usr/bin/env bash

set -eo pipefail

export PYTHONPATH="./:${PYTHONPATH}"

SPACE_NAME=$(echo "${VCAP_APPLICATION}" | jq --raw-output '.space_name')

if [[ "${SPACE_NAME}" == "john.skinner" ]]; then
    # In dev environment, remove test data before running migrations to
    # avoid constraint errors
    python ./opre_ops/manage.py custom-flush --allow-cascade --no-input
fi

python ./opre_ops/manage.py migrate

if [[ "${SPACE_NAME}" == "john.skinner" ]]; then
    # Load the fake data because we're deploying to the dev environment
    python ./opre_ops/manage.py loaddata ./opre_ops/ops_site/fixtures/fake_data.json
fi

python -m gunicorn opre_ops.django_config.asgi:application --worker-class=uvicorn.workers.UvicornWorker --bind=0.0.0.0:8080
