from unittest import mock

import pytest
import sqlalchemy.engine
from src.import_static_data.import_data import delete_existing_data
from src.import_static_data.import_data import get_config
from src.import_static_data.import_data import import_data
from src.import_static_data.import_data import init_db
from src.import_static_data.import_data import load_new_data


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

        mock_conn = mock.MagicMock()
        delete_existing_data(mock_conn, {"division": [], "portfolio": [], "table3": []})
        assert mock_conn.execute.call_count == 0


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


def test_import_data():
    mock_engine = mock.MagicMock()
    mock_meta = mock.MagicMock()
    with mock.patch(
        "src.import_static_data.import_data.delete_existing_data"
    ) as mock_delete, mock.patch(
        "src.import_static_data.import_data.load_new_data"
    ) as mock_load:
        import_data(mock_engine, mock_meta, {})
        assert mock_delete.call_count == 1
        assert mock_load.call_count == 1
