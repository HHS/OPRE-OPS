#!/bin/bash

# todo: django docs say don't use this `runserver` command in prod
pip install --upgrade pip pipenv && pipenv install

python ./opre_ops/manage.py runserver 0.0.0.0:8080
