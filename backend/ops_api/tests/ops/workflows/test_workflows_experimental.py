import pytest

from models import AgreementChangeRequest, ChangeRequest


@pytest.mark.usefixtures("app_ctx")
def test_change_request(auth_client, app):
    session = app.db_session
    change_request = ChangeRequest()
    change_request.created_by = 1
    change_request.requested_changes = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.type == "change_request"


@pytest.mark.usefixtures("app_ctx")
def test_agreement_change_request(auth_client, app):
    session = app.db_session
    change_request = AgreementChangeRequest()
    change_request.agreement_id = 1
    change_request.created_by = 1
    change_request.requested_changes = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.type == "agreement_change_request"
