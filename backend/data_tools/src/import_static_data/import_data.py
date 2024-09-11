import logging
import os

import json5
import sqlalchemy.engine
from data_tools.environment.azure import AzureConfig
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.common import DataToolsConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.local_migration import LocalMigrationConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.test import TestConfig
from sqlalchemy import create_engine, insert, inspect, text
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.orm import Session
from sqlalchemy.schema import MetaData

logging.basicConfig(level=logging.INFO)

from models import *  # noqa: F403, F401

# Whitelisting here to help mitigate a SQL Injection attack from the JSON data
ALLOWED_TABLES = [
    "division",
    "portfolio_url",
    "portfolio",
    "funding_partner",
    "funding_source",
    "ops_user",
    "roles",
    "user_role",
    "groups",
    "user_group",
    "can",
    "can_fiscal_year",
    "can_funding_sources",
    "agreement",
    "contract_agreement",
    "grant_agreement",
    "iaa_agreement",
    "iaa_aa_agreement",
    "direct_agreement",
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
    "agreement_team_members",
    "notification",
    "workflow_template",
    "workflow_step_template",
    "workflow_instance",
    "workflow_step_instance",
    "package",
    "package_snapshot",
    "workflow_step_dependency",
    "step_approvers",
    "vendor",
    "contact",
    "vendor_contacts",
    "clin",
    "services_component",
    "procurement_step",
    "procurement_acquisition_planning",
    "procurement_pre_solicitation",
    "procurement_solicitation",
    "procurement_award",
    "can_fiscal_year_funding_details",
    "can_appropriation_details",
    "can_funding_received",
    "can_funding_budget",
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
        case "azure":
            config = AzureConfig()
        case "cloudgov":
            config = CloudGovConfig()
        case "local":
            config = LocalConfig()
        case "local-migration":
            config = LocalMigrationConfig()
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


def load_new_data(
    conn: sqlalchemy.engine.Engine,
    data: dict[str, Any],
) -> None:
    for name, data_items in data.items():
        logging.debug(f"Loading {name}...")
        model = BaseModel.model_lookup_by_table_name(name)
        if model:
            seq_needs_reset = False
            for datum in data_items:
                # values of type list[dict] are associations
                data_without_associations = {
                    key: value
                    for key, value in datum.items()
                    if not isinstance(value, list) or any([not isinstance(obj, dict) for obj in value])
                }
                data_with_associations = {
                    key: value
                    for key, value in datum.items()
                    if isinstance(value, list) and all([isinstance(obj, dict) for obj in value])
                }
                with Session(conn) as session:
                    if "id" in data_without_associations:
                        seq_needs_reset = True
                    obj = model(**data_without_associations)
                    session.add(obj)
                    session.commit()
                    insert_associated_data(data_with_associations, obj, session)
            if seq_needs_reset:
                with Session(conn) as session:
                    print(f"Resetting ID sequence for {name} (after IDs were set manually) ...")
                    stmt = (
                        f"SELECT setval(pg_get_serial_sequence('ops.{name}', 'id'), coalesce(max(id),0) + 1, false) "
                        f"FROM ops.services_component;"
                    )
                    session.execute(text(stmt))


def after_user_load(conn: Connection) -> None:
    # set DD to Dave Director and Deputy DD to Admin Demo
    with Session(conn) as session:
        print("Setting Division Director and Deputy Division Director...")
        stmt = (
            "update ops.division "
            "  set division_director_id = (select id from ops.ops_user where email = 'dave.director@email.com') "
            "  where division_director_id is null; "
            "update ops.division "
            "  set deputy_division_director_id = (select id from ops.ops_user where email = 'admin.demo@email.com') "
            "  where deputy_division_director_id is null;"
        )
        session.execute(text(stmt))
        session.commit()


def insert_associated_data(data_with_associations, obj, session):
    for key, value in data_with_associations.items():
        for associated_id in value:
            associated_model = BaseModel.model_lookup_by_table_name(associated_id.get("tablename"))
            associated_obj = session.get(associated_model, associated_id.get("id"))
            getattr(obj, key).append(associated_obj)
            session.add(obj)
            session.commit()


def import_data(engine: Engine, data: dict[str, Any]) -> None:
    with engine.connect() as conn:
        load_new_data(conn, data)
        conn.commit()
        if "ops_user" in data:
            after_user_load(conn)


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)

    global_data = get_data_to_import()

    import_data(db_engine, global_data)
