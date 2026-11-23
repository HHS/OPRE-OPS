from unittest.mock import MagicMock, Mock, patch

import pytest

from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import ResourceNotFoundError


@pytest.fixture
def mock_db_session():
    return MagicMock()


@pytest.fixture
def service(mock_db_session):
    return ChangeRequestService(mock_db_session)


def test_delete_success(service, mock_db_session):
    change_request = Mock()
    mock_db_session.get.return_value = change_request

    service.delete(1)

    mock_db_session.delete.assert_called_once_with(change_request)
    mock_db_session.commit.assert_called_once()


def test_delete_not_found(service, mock_db_session):
    mock_db_session.get.return_value = None
    with pytest.raises(ResourceNotFoundError):
        service.delete(999)


def test_get_list_uses_find_in_review_requests_by_user(service):
    with patch("ops_api.ops.services.change_requests.find_in_review_requests_by_user") as mock_find:
        mock_find.return_value = [Mock()], 1
        results, pagination = service.get_list({"reviewer_user_id": 1, "limit": 10, "offset": 0})

        assert isinstance(results, list)
        assert len(results) == 1
        assert pagination == {"count": 1, "limit": 10, "offset": 0}
        mock_find.assert_called_once_with(1, 10, 0)
