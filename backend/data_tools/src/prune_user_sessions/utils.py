import os

from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import get_config


def prune_user_sessions(db_engine):
    pass


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    prune_user_sessions(db_engine)
