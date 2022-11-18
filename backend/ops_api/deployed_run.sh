#!/usr/bin/env bash

set -eo pipefail

export PYTHONPATH="./:${PYTHONPATH}"
export FLASK_APP=ops
export FLASK_DEBUG=true

python -m gunicorn -b ":8080" "ops:create_app()"
