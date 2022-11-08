import os
from unittest.mock import call
from unittest import mock
from unittest.mock import MagicMock

import sqlalchemy.engine
import pytest_mock
from pytest_mock import mocker

from src.import_static_data.import_data import delete_existing_data, get_config, init_db


# def test_delete_existing_data(mocker):
#     portfolio_data = {"table1": [], "table2": [], "table3": []}
#     mocker.patch.object("sqlalchemy.create_engine")
#     delete_existing_data(None, portfolio_data)

def test_init_db():
    engine, metadata_obj = init_db("sqlite://")
    assert isinstance(engine, sqlalchemy.engine.Engine)
    assert isinstance(metadata_obj, sqlalchemy.MetaData)


def test_get_config_default():
    with mock.patch("src.import_static_data.import_data.load_module") as mock_load:
        get_config()
        assert mock_load.call_count == 1
        assert mock_load.call_args_list[0].args == ("environment.dev",)


def test_get_config_prod():
    with mock.patch("src.import_static_data.import_data.load_module") as mock_load:
        get_config("cloudgov")
        assert mock_load.call_count == 1
        assert mock_load.call_args_list[0].args == ("environment.cloudgov",)
