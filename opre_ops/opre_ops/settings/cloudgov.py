"""
Configuration for running OPRE OPS in cloud.gov.
"""
import os
import json
import cfenv

# Import all common settings relevant to both local & cloud:
from opre_ops.settings.common import *
# Import helper to generate a random string for our local secret key:
from opre_ops.settings.helpers.random_string import generate_random_string

env = cfenv.AppEnv()

# Helper function
def get_json_env_var(variable_name):
    """Retrieve and serialize a JSON environment variable."""
    return json.loads(
        os.getenv(variable_name, '{}')
    )


# Cloud.gov exposes variables for the application and bound services via
# VCAP_APPLICATION and VCAP_SERVICES environment variables, respectively.
vcap_services = get_json_env_var('VCAP_SERVICES')

# Note: if or when we have more than one db per application instance,
# we will need to do something smarter than taking the first db in the list
database_service = vcap_services['aws-rds'][0]
database_creds = database_service['credentials']


# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': database_creds['db_name'],
        'USER': database_creds['username'],
        'PASSWORD': database_creds['password'],
        'HOST': database_creds['host'],
        'PORT': database_creds['port']
    }
}

# SECURITY: Keep the secret keys used in production secret!
SECRET_KEY = env.get_credential('APP_SECRET_KEY', generate_random_string(50))

DEBUG = False

ALLOWED_HOSTS = [".cloud.gov"]
CSRF_TRUSTED_ORIGINS = ['https://opre-ops-test.app.cloud.gov']
