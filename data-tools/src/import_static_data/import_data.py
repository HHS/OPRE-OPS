import os
from typing import Dict, Tuple

import json5
from sqlalchemy import create_engine
from sqlalchemy import insert
from sqlalchemy import inspect
from sqlalchemy import MetaData
from sqlalchemy import text
import sqlalchemy.engine

# Whitelisting here to help mitigate a SQL Injection attack from the JSON data
ALLOWED_TABLES = [
    "division",
    "portfolio_url",
    "portfolio",
    "portfolio_status",
    "funding_partner",
    "funding_source",
    "users",
    "can",
    "can_fiscal_year",
    "can_arrangement_type",
    "agreement_type",
    "agreement",
    "agreement_cans",
    "budget_line_item",
    "budget_line_item_status",
    "portfolio_description_text",
    "can_fiscal_year_carry_over",
]

ALLOWED_ENVIRONMENTS = [
    "environment.dev",
    "environment.local",
    "environment.cloudgov",
    "environment.test",
]

env = os.getenv("ENV")
data = os.getenv("DATA")


def init_db(
    database_url: str, verbose: bool = True
) -> Tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    engine = create_engine(database_url, echo=verbose, future=True)
    metadata_obj = MetaData()
    metadata_obj.reflect(bind=engine)

    return engine, metadata_obj


def load_module(module_name: str):
    if module_name not in ALLOWED_ENVIRONMENTS:
        raise RuntimeError("Unknown environment")
    return importlib.import_module(module_name)


def get_config(environment_name: str = env):
    module_name = (
        f"environment.{environment_name}" if environment_name else "environment.dev"
    )
    return load_module(module_name)


def get_data_to_import(file_name: str = data) -> Dict:
    return json5.load(open(file_name))


def exists(conn, table):  # pragma: no cover
    return inspect(conn).has_table(table)


def delete_existing_data(conn: sqlalchemy.engine.Engine.connect, data: Dict):
    for ops_table in data:
        if ops_table not in ALLOWED_TABLES:
            raise RuntimeError("Table not allowed")
        # Only truncate if it actually exists
        if exists(conn, ops_table):
            # nosemgrep: python.sqlalchemy.security.audit.avoid-sqlalchemy-text.avoid-sqlalchemy-text
            conn.execute(text(f"TRUNCATE TABLE {ops_table} CASCADE;"))
        else:
            return "Table does not exist"


def load_new_data(
    conn: sqlalchemy.engine.Engine, data, metadata_obj: sqlalchemy.MetaData
):
    for ops_table in data:
        d = data[ops_table]
        conn.execute(
            insert(metadata_obj.tables[ops_table]),
            d,
        )


def import_data(engine, metadata_obj, data):
    with engine.connect() as conn:
        delete_existing_data(conn, data)
        conn.commit()

        load_new_data(conn, data, metadata_obj)
        conn.commit()


if __name__ == "__main__":
    import importlib

    global_configuration = get_config()
    global_data = get_data_to_import()
    global_engine, global_metadata_obj = init_db(
        global_configuration.DATABASE_URL, global_configuration.VERBOSE
    )

    import_data(global_engine, global_metadata_obj, global_data)
