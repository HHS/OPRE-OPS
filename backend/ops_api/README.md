# ops

ops description

## Quick Start

Run the application:

    make run

And open it in the browser at [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

## Prerequisites

Python >=3.11

## Development environment

 - In order to be able to login to the SSO Provide (login.gov) the `JWT_PRIVATE_KEY` ENV var must be set prior to running the Flask API Backend. The

## Configuration

Default configuration is loaded from `ops_api.default_settings` and can be
overriden by environment variables with a `FLASK_` prefix. See
[Configuring from Environment Variables](https://flask.palletsprojects.com/en/2.1.x/config/#configuring-from-environment-variables).

Consider using
[dotenv](https://flask.palletsprojects.com/en/2.1.x/cli/#environment-variables-from-dotenv).

## Deployment

See [Deploying to Production](https://flask.palletsprojects.com/en/2.1.x/deploying/).

You may use the distribution (`make dist`) to publish it to a package index,
deliver to your server, or copy in your `Dockerfile`, and insall it with `pip`.

You must set a
[SECRET_KEY](https://flask.palletsprojects.com/en/2.1.x/tutorial/deploy/#configure-the-secret-key)
in production to a secret and stable value.
