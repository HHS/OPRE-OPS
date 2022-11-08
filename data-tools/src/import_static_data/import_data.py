from typing import Tuple, Dict

import sqlalchemy.engine
from sqlalchemy import create_engine, insert, MetaData, text
import json5
import os
import importlib


def init_db(database_url: str) -> Tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    engine = create_engine(database_url, echo=True, future=True)
    metadata_obj = MetaData()
    metadata_obj.reflect(bind=engine)

    return engine, metadata_obj


def load_module(module_name: str):
    return importlib.import_module(module_name)


def get_config(environment_name: str = os.getenv("ENV")):
    module_name = (
        f"environment.{environment_name}" if environment_name else "environment.dev"
    )
    return load_module(module_name)


def get_data_to_import(file_name: str = os.getenv("DATA")) -> Dict:
    return json5.load(open(f"data/{file_name}"))


def delete_existing_data(conn: sqlalchemy.engine.Engine, portfolio_data: Dict):
    for ops_table in portfolio_data:
        conn.execute(text(f"TRUNCATE {ops_table} CASCADE;"))


def load_new_data(
    conn: sqlalchemy.engine.Engine, portfolio_data, metadata_obj: sqlalchemy.MetaData
):
    for ops_table in portfolio_data:
        data = portfolio_data[ops_table]
        conn.execute(
            insert(metadata_obj.tables[ops_table]),
            data,
        )


def import_data(engine, metadata_obj, portfolio_data):
    with engine.connect() as conn:
        delete_existing_data(conn, portfolio_data)
        conn.commit()

        load_new_data(conn, portfolio_data, metadata_obj)
        conn.commit()


if __name__ == "__main__":
    import importlib

    global_configuration = get_config()
    global_data = get_data_to_import()
    global_engine, global_metadata_obj = init_db(global_configuration.DATABASE_URL)

    import_data(global_engine, global_metadata_obj, global_data)
