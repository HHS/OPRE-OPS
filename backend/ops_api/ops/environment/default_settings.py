import os
from datetime import timedelta

DEBUG = False  # make sure DEBUG is off unless enabled explicitly otherwise

# SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://postgres:local_password@localhost:5432/postgres"
SQLALCHEMY_TRACK_MODIFICATIONS = False
FLASK_PORT = 8080

JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY")
# JWT_SECRET_KEY = "adfadfasdasfasdfasdfasfasdfasdfadfadfadfasdfasffasff"
JWT_PUBLIC_KEY_PATH = "./static/public.pem"
JWT_ALGORITHM = "RS256"
JWT_DECODE_ALGORITHMS = "RS256"
JWT_TOKEN_LOCATION = "headers"  # noqa: S105 "Not a secret"
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=1)
