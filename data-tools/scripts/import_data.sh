#!/bin/bash

export PYTHONPATH=.:$PYTHONPATH

DATA=data/portfolio_data.json5 python src/import_static_data/import_data.py
DATA=data/funding_partner_data.json5 python src/import_static_data/import_data.py
DATA=data/funding_source_data.json5 python src/import_static_data/import_data.py
DATA=data/user_data.json5 python src/import_static_data/import_data.py
DATA=data/can_data.json5 python src/import_static_data/import_data.py
DATA=data/agreements_and_blin_data.json5 python src/import_static_data/import_data.py
