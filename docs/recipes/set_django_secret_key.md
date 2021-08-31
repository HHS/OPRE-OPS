# How to: set Django SECRET_KEY in the cloud

The cloud.gov docs recommend using [user-provided services](https://docs.cloudfoundry.org/devguide/services/user-provided.html) to store sensitive information such as credentials.

To store Django's [SECRET_KEY](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY) in a cloud environment, follow these steps in your command line:

```
# first, log in:
cf login --sso

# then, create a service named "OPRE_OPS_ENV_SERVICE" and pass in this key/value pair:
cf cups OPRE_OPS_ENV_SERVICE -p '{"DJANGO_SECRET_KEY":"your_secure_secret_key_here"}'

# then, bind the service to the app that will need the ENV service:
cf bind-service app_name_goes_here OPRE_OPS_ENV_SERVICE
```