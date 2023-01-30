#!/usr/bin/env bash

set -eo pipefail

export PYTHONPATH=".:..:${PYTHONPATH}"
export FLASK_APP=ops_api
export FLASK_DEBUG=true

python -m gunicorn -b ":8080" "ops_api:create_app()"
#python -m flask run --port=8080 --host=0.0.0.0
