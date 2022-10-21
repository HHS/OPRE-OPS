#!/bin/bash

PYTHONPATH=/home/app
PYTHONUNBUFFERED=1
DJANGO_SETTINGS_MODULE=ops_api.django_config.settings.local

docker run -rm -d -e JWT_PRIVATE_KEY \
-v $(PWD)/backend/ops_api:/home/app/ops_api \
ops-backend \

python $(PWD)/backend/ops_api/manage.py custom-flush --allow-cascade --no-input && \
python $(PWD)/backend/ops_api/manage.py makemigrations && \
python $(PWD)/backend/ops_api/manage.py migrate && \
python $(PWD)/backend/ops_api/manage.py loaddata ./ops_api/ops/fixtures/fake_data.json
