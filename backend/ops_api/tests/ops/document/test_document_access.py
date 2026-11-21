import pytest
from flask import url_for
from sqlalchemy import select

from models import AgreementType, ContractAgreement, Document, User

BASIC_USER_ID = 521


@pytest.fixture
def agreement_for(loaded_db):
    def _make(project_officer_id=None, team_member_ids=()):
        agreement = ContractAgreement(
            name="Document access test",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=project_officer_id,
        )
        agreement.team_members = [loaded_db.get(User, user_id) for user_id in team_member_ids]
        loaded_db.add(agreement)
        loaded_db.commit()
        return agreement

    return _make


def _post_document(client, agreement_id):
    return client.post(
        url_for("api.documents-list"),
        json={
            "agreement_id": agreement_id,
            "document_type": "CERTIFICATION_OF_FUNDING",
            "document_name": "access.pdf",
            "document_size": 1.0,
        },
    )


def _documents_for(loaded_db, agreement_id):
    loaded_db.expire_all()
    return loaded_db.scalars(select(Document).where(Document.agreement_id == agreement_id)).all()


def test_user_not_linked_to_agreement_cannot_upload_or_list_documents(
    basic_user_auth_client, loaded_db, agreement_for, app_ctx
):
    agreement = agreement_for(project_officer_id=None)

    post_response = _post_document(basic_user_auth_client, agreement.id)
    get_response = basic_user_auth_client.get(
        url_for("api.documents-list"), query_string={"agreement_id": agreement.id}
    )

    assert post_response.status_code == 401
    assert get_response.status_code == 401
    assert _documents_for(loaded_db, agreement.id) == []


@pytest.mark.parametrize(
    "link",
    [
        {"project_officer_id": BASIC_USER_ID},
        {"team_member_ids": (BASIC_USER_ID,)},
    ],
    ids=["project_officer", "team_member"],
)
def test_user_linked_to_agreement_can_upload_and_list_documents(
    basic_user_auth_client, loaded_db, agreement_for, link, app_ctx
):
    agreement = agreement_for(**link)

    post_response = _post_document(basic_user_auth_client, agreement.id)
    get_response = basic_user_auth_client.get(
        url_for("api.documents-list"), query_string={"agreement_id": agreement.id}
    )

    assert post_response.status_code == 201, post_response.json
    assert get_response.status_code == 200, get_response.json
    documents = _documents_for(loaded_db, agreement.id)
    assert [document.document_name for document in documents] == ["access.pdf"]
