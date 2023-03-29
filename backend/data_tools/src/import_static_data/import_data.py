import os
from typing import Any, Optional, cast

import json5
import models.cans
import models.portfolios
import models.procurement_shops
import models.research_projects
import models.users
import sqlalchemy.engine
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.common import DataToolsConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.test import TestConfig
from models.base import BaseModel
from sqlalchemy import create_engine, insert, inspect, text
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.schema import MetaData

# Adding these print statements to suppress unused import warnings
print("Loading models for CANs", models.cans)
print("Loading models for Portfolios", models.portfolios)
print("Loading models for Research Projects", models.research_projects)
print("Loading models for Users", models.users)
print("Loading models for Procurement Shop", models.procurement_shops)

# Whitelisting here to help mitigate a SQL Injection attack from the JSON data
ALLOWED_TABLES = [
    "division",
    "portfolio_url",
    "portfolio",
    "funding_partner",
    "funding_source",
    "users",
    "roles",
    "user_role",
    "can",
    "can_fiscal_year",
    "can_funding_sources",
    "agreement",
    "budget_line_item",
    "budget_line_item_status",
    "can_fiscal_year_carry_forward",
    "portfolio_team_leaders",
    "research_project",
    "research_project_cans",
    "research_project_team_leaders",
    "shared_portfolio_cans",
    "research_project_methodologies",
    "research_project_populations",
    "procurement_shop",
]

data = os.getenv("DATA")


def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        engine = create_engine(
            config.db_connection_string,
            echo=config.verbosity,
            future=True,
        )
    else:
        engine = db
    return engine, BaseModel.metadata


def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    config: DataToolsConfig
    match environment_name:
        case "cloudgov":
            config = CloudGovConfig()
        case "local":
            config = LocalConfig()
        case "test":
            config = TestConfig()
        case "pytest":
            config = PytestConfig()
        case _:
            config = DevConfig()
    return config


def get_data_to_import(file_name: Optional[str] = data) -> dict[str, Any]:
    if file_name is None:
        raise ValueError
    return cast(dict[str, Any], json5.load(open(file_name)))


def exists(conn: Connection, table: str) -> bool:  # pragma: no cover
    return cast(bool, inspect(conn).has_table(table))


def delete_existing_data(  # type: ignore [return]
    conn: Connection,
    data: dict[str, Any],
) -> Optional[str]:
    for ops_table in data:
        if ops_table not in ALLOWED_TABLES:
            raise RuntimeError("Table not allowed")
        # Only truncate if it actually exists
        if exists(conn, ops_table):
            # nosemgrep: python.sqlalchemy.security.audit.avoid-sqlalchemy-text.avoid-sqlalchemy-text
            conn.execute(text(f"TRUNCATE TABLE {ops_table} RESTART IDENTITY CASCADE;"))
        else:
            return "Table does not exist"


def load_new_data(
    conn: sqlalchemy.engine.Engine,
    data: dict[str, Any],
    metadata_obj: sqlalchemy.MetaData,
) -> None:
    for name, data in data.items():  # noqa: B020
        conn.execute(insert(metadata_obj.tables[name]), data)


def import_data(engine: Engine, metadata_obj: MetaData, data: dict[str, Any]) -> None:
    with engine.connect() as conn:
        load_new_data(conn, data, metadata_obj)
        conn.commit()


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)

    global_data = get_data_to_import()

    import_data(db_engine, db_metadata_obj, global_data)
