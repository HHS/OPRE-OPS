"""
Configuration for running OPRE OPS in cloud.gov.
"""
import json
import os

import cfenv

env = cfenv.AppEnv()

# Cloud.gov exposes variables for the application and bound services via
# VCAP_APPLICATION and VCAP_SERVICES environment variables, respectively.
vcap_services = json.loads(os.getenv("VCAP_SERVICES", "{}"))

# Note: if or when we have more than one db per application instance,
# we will need to do something smarter than taking the first db in the list
database_service = vcap_services["aws-rds"][0]
database_creds = database_service["credentials"]

DATABASE_URL = f'postgresql+psycopg2://{database_creds["username"]}:{database_creds["password"]}@{database_creds["host"]}:{database_creds["port"]}/{database_creds["db_name"]}'
VERBOSE = True
