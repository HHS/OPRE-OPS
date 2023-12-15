import os

from ops_api.ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = True

# Pull secrets from ACA Environment
db_username = os.getenv("PGUSER")
db_password = os.getenv("PGPASSWORD")
db_host = os.getenv("PGHOST")
db_port = os.getenv("PGPORT")
db_name = os.getenv("PGDATABASE")

SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"  # noqa: B950
