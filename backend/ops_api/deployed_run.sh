#!/usr/bin/env bash

set -eo pipefail

export PYTHONPATH=".:..:${PYTHONPATH}"
export FLASK_APP=ops_api.ops
export FLASK_DEBUG=true

ls -la
cd ops_api
pipenv install --dev --system --deploy
cd ..
python -m gunicorn -b ":8080" --log-level DEBUG "ops_api.ops:create_app()"
#python -m flask run --port=8080 --host=0.0.0.0
