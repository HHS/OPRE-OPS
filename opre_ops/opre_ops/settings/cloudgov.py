"""
Configuration for running OPRE OPS in cloud.gov.
"""
import os

# Import all common settings relevant to both local & cloud:
from opre_ops.settings.common import *

# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DATABASE_NAME'),
        'USER': os.environ.get('DATABASE_USER'),
        'PASSWORD': os.environ.get('DATABASE_PASSWORD'),
        'HOST': os.environ.get('DATABASE_HOST'),
        'PORT': '5432'
    }
}

# SECURITY: Keep the secret keys used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY'),

DEBUG = False

ALLOWED_HOSTS = [".cloud.gov"]
