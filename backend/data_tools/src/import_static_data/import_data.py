import os
from typing import Dict, Optional, Tuple

import json5
import models.cans
import models.portfolios
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
from sqlalchemy import create_engine, insert, inspect
from sqlalchemy.engine import Engine

# Adding these print statements to suppress unused import warnings
print("Loading models for CANs", models.cans)
print("Loading models for Portfolios", models.portfolios)
print("Loading models for Research Projects", models.research_projects)
print("Loading models for Users", models.users)

# Whitelisting here to help mitigate a SQL Injection attack from the JSON data
ALLOWED_TABLES = [
    "division",
    "portfolio_url",
    "portfolio",
    "funding_partner",
    "funding_source",
    "users",
    "can",
    "can_fiscal_year",
    "can_funding_sources",
    "agreement",
    "agreement_cans",
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
]

data = os.getenv("DATA")


def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> Tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        engine = create_engine(
            config.db_connection_string, echo=config.verbosity, future=True
        )
    else:
        engine = db
    BaseModel.metadata.create_all(engine)
    return engine, BaseModel.metadata


def get_config(environment_name: str = None):
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


def get_data_to_import(file_name: str = data) -> Dict:
    return json5.load(open(file_name))


def exists(conn, table):  # pragma: no cover
    return inspect(conn).has_table(table)


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
        load_new_data(conn, data, metadata_obj)
        conn.commit()


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    print(f"Data-Tools Config: {script_config.db_connection_string}")

    db_engine, db_metadata_obj = init_db(script_config)

    global_data = get_data_to_import()

    import_data(db_engine, db_metadata_obj, global_data)
