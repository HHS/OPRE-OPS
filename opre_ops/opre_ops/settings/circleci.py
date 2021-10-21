from opre_ops.settings.helpers.random_string import generate_random_string

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'local_password',
        'HOST': 'db',
        'PORT': '5432'
    }
}

SECRET_KEY = generate_random_string(50)