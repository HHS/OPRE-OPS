import sqlalchemy
from data_tools.environment.pytest import PytestConfig
from data_tools.src.common.utils import init_db


def test_init_db(db_service):
    _, engine = db_service
    engine, metadata_obj = init_db(PytestConfig(), engine)
    assert isinstance(engine, sqlalchemy.engine.Engine)
    assert isinstance(metadata_obj, sqlalchemy.MetaData)
