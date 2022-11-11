#!/bin/bash

export PYTHONPATH=.:$PYTHONPATH

ENV=local DATA=data.json5 python src/import_static_data/import_data.py
