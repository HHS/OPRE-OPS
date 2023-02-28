#!/usr/bin/env bash

set -eo pipefail


export PYTHONPATH=".:..:${PYTHONPATH}"
export FLASK_APP=ops_api.ops
export FLASK_DEBUG=true

# Adding this to help with a warning when deploying to Cloud.gov
export PATH="/home/vcap/deps/0/python/bin:$PATH"

cd ops_api
python -m pip install --no-cache-dir --upgrade pip==22.3.1 pipenv==2023.2.4
python -m pipenv install --dev --system --deploy
cd ..
#python -m gunicorn -b ":8080" "ops_api.ops:create_app()"
python -m flask run --port=8080 --host=0.0.0.0
