from unittest.mock import MagicMock, Mock, patch

import pytest

from models import ChangeRequest, ChangeRequestStatus, ChangeRequestType
from ops_api.ops.services.change_request import ChangeRequestService
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError


@pytest.fixture
def mock_db_session():
    return MagicMock()


@pytest.fixture
def service(mock_db_session):
    return ChangeRequestService(mock_db_session)


def test_create_agreement_change_request(service, mock_db_session):
    mock_db_session.commit = MagicMock()
    mock_change_request_data = {
        "change_request_type": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        "agreement_id": 1,
        "requested_change_data": {"some": "data"},
    }

    with patch("ops_api.ops.services.change_request.get_model_class_by_type") as mock_get_model_class:
        mock_model = MagicMock()
        mock_get_model_class.return_value = mock_model
        mock_instance = mock_model.return_value
        service._notify_division_reviewers = MagicMock()

        result = service.create(mock_change_request_data)

        assert result == mock_instance
        mock_db_session.add.assert_called_once_with(mock_instance)
        mock_db_session.commit.assert_called_once()
        service._notify_division_reviewers.assert_called_once()


def test_update_change_request_authorized(service, mock_db_session):
    change_request = Mock(spec=ChangeRequest)
    change_request.status = ChangeRequestStatus.IN_REVIEW
    change_request.change_request_type = ChangeRequestType.AGREEMENT_CHANGE_REQUEST
    change_request.agreement = Mock()
    change_request.id = 1
    change_request.created_by = 10

    mock_db_session.get.return_value = change_request

    service._is_division_director_of_change_request = Mock(return_value=True)
    service._handle_review_action = Mock(return_value={"model_to_update": None})
    service._notify_submitter_of_review_outcome = Mock()

    updated_fields = {"action": "APPROVE", "reviewer_notes": "Looks good"}

    with patch("ops_api.ops.services.change_request.current_user", Mock(id=5)):
        result, status = service.update(1, updated_fields)

    assert result == change_request
    assert status == 200
    mock_db_session.commit.assert_called_once()


def test_update_change_request_unauthorized(service, mock_db_session):
    change_request = Mock(spec=ChangeRequest)
    change_request.id = 1
    change_request.change_request_type = ChangeRequestType.AGREEMENT_CHANGE_REQUEST
    change_request.agreement = Mock()

    mock_db_session.get.return_value = change_request
    service._is_division_director_of_change_request = Mock(return_value=False)

    with pytest.raises(AuthorizationError):
        service.update(1, {})


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
    with patch("ops_api.ops.services.change_request.find_in_review_requests_by_user") as mock_find:
        mock_find.return_value = [Mock()]
        results, pagination = service.get_list({"reviewer_user_id": 1})

        assert isinstance(results, list)
        assert len(results) == 1
        assert pagination is None
        mock_find.assert_called_once_with(1, None, None)
