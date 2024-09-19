from unittest import mock

import pytest
import sqlalchemy.engine
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.test import TestConfig
from data_tools.src.import_static_data.import_data import get_config, import_data, init_db, load_new_data


def test_init_db(db_service):
    engine, metadata_obj = init_db(TestConfig(), db_service)
    assert isinstance(engine, sqlalchemy.engine.Engine)
    assert isinstance(metadata_obj, sqlalchemy.MetaData)


def test_get_config_default():
    assert isinstance(get_config(), DevConfig)


def test_get_config_prod():
    assert isinstance(get_config("cloudgov"), CloudGovConfig)


def test_load_new_data_empty():
    mock_conn = mock.MagicMock()
    load_new_data(mock_conn, {})
    assert mock_conn.execute.call_count == 0


def test_import_data(mocker):
    mock_engine = mocker.MagicMock()
    mock_load = mocker.patch(
        "data_tools.src.import_static_data.import_data.load_new_data"
    )

    import_data(mock_engine, {})

    assert mock_load.called
