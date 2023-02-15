from unittest import mock

import pytest
import sqlalchemy.engine
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.test import TestConfig
from data_tools.src.import_static_data.import_data import (
    delete_existing_data,
    get_config,
    import_data,
    init_db,
    load_new_data,
)


def test_init_db(db_service):
    engine, metadata_obj = init_db(TestConfig(), db_service)
    assert isinstance(engine, sqlalchemy.engine.Engine)
    assert isinstance(metadata_obj, sqlalchemy.MetaData)


def test_get_config_default():
    assert isinstance(get_config(), DevConfig)


def test_get_config_prod():
    assert isinstance(get_config("cloudgov"), CloudGovConfig)


def test_delete_existing_data_empty():
    mock_conn = mock.MagicMock()
    delete_existing_data(mock_conn, {})
    assert mock_conn.execute.call_count == 0


def test_delete_existing_data():
    with mock.patch("src.import_static_data.import_data.exists") as mock_exists:
        mock_exists.return_value = True

        mock_conn = mock.MagicMock()
        with pytest.raises(RuntimeError):
            delete_existing_data(
                mock_conn, {"division": [], "portfolio": [], "table3": []}
            )
            assert mock_conn.execute.call_count == 3
            assert (
                mock_conn.execute.call_args_list[0].args[0].text
                == "TRUNCATE division CASCADE;"
            )
            assert (
                mock_conn.execute.call_args_list[1].args[0].text
                == "TRUNCATE portfolio CASCADE;"
            )


def test_delete_existing_data_nonexistant_table():
    with mock.patch("src.import_static_data.import_data.exists") as mock_exists:
        mock_exists.return_value = False

        with pytest.raises(RuntimeError) as e:
            mock_conn = mock.MagicMock()
            delete_existing_data(
                mock_conn, {"division": [], "portfolio": [], "table3": []}
            )
            assert e.value.message == "Table not allowed"


def test_load_new_data_empty():
    mock_conn = mock.MagicMock()
    mock_meta = mock.MagicMock()
    load_new_data(mock_conn, {}, mock_meta)
    assert mock_conn.execute.call_count == 0


def test_load_new_data():
    mock_conn = mock.MagicMock()
    mock_meta = mock.MagicMock()
    mock_meta.return_value = {}
    # Test is a little weak - would be better to fully mock the MetaData obj
    with pytest.raises(sqlalchemy.exc.ArgumentError):
        load_new_data(mock_conn, {"table1": [{}]}, mock_meta)


def test_import_data(mocker):
    mock_engine = mocker.MagicMock()
    mock_meta = mocker.MagicMock()
    mock_delete = mocker.patch(
        "data_tools.src.import_static_data.import_data.delete_existing_data"
    )
    mock_load = mocker.patch(
        "data_tools.src.import_static_data.import_data.load_new_data"
    )

    import_data(mock_engine, mock_meta, {})

    assert mock_delete.called
    assert mock_load.called
