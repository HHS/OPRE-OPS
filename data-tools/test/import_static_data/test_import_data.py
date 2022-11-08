import os
from unittest import mock

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


@mock.patch("src.import_static_data.import_data.load_module")
def test_get_config(mocked_func):
    get_config("dev")
    assert mocked_func.call_count == 1
    assert mocked_func.assert_called_once_with("environment.dev")
