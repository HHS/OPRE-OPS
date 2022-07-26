# How to: set Django SECRET_KEY in the cloud

The cloud.gov docs recommend using [user-provided services](https://docs.cloudfoundry.org/devguide/services/user-provided.html) to store sensitive information such as credentials.

To store Django's [SECRET_KEY](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY) in a cloud environment, follow these steps in your command line:

```
# first, log in:
cf login --sso

# then, create a service named "opre-ops-env-service" and pass in this key/value pair:
cf cups opre-ops-env-service -p '{"DJANGO_SECRET_KEY":"your_secure_secret_key_here"}'

# the app manifest (manifest.yml) specifies an application bind to opre-ops-env-service; you may need to re-start the app to apply the bind
```
