import os

from common.utils import get_config, init_db

if __name__ == "__main__":
    script_env = os.getenv("ENV")
    if script_env is None:
        raise ValueError
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)
