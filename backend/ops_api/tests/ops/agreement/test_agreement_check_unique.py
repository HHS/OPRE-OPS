"""Tests for the agreement check-unique endpoint and service."""

import pytest
from flask import url_for

from models import Agreement, AgreementType
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.ops_service import ValidationError


@pytest.fixture
def service(loaded_db):
    return AgreementsService(loaded_db)


@pytest.fixture
def existing_contract(loaded_db):
    """An arbitrary CONTRACT-type agreement seeded in the test DB."""
    agreement = loaded_db.get(Agreement, 1)
    assert agreement is not None
    assert agreement.agreement_type == AgreementType.CONTRACT
    return agreement


def test_check_unique_name_is_unique(service):
    assert service.check_unique("name", "Definitely a brand new title", AgreementType.CONTRACT, None) is True


def test_check_unique_name_is_duplicate_for_same_type(service, existing_contract):
    assert service.check_unique("name", existing_contract.name, AgreementType.CONTRACT, None) is False


def test_check_unique_name_is_case_insensitive(service, existing_contract):
    assert service.check_unique("name", existing_contract.name.upper(), AgreementType.CONTRACT, None) is False


def test_check_unique_name_unique_in_different_type(service, existing_contract):
    # Same name but different agreement_type should be unique because the
    # composite index is scoped per type.
    assert service.check_unique("name", existing_contract.name, AgreementType.GRANT, None) is True


def test_check_unique_name_excludes_self(service, existing_contract):
    assert (
        service.check_unique("name", existing_contract.name, AgreementType.CONTRACT, exclude_id=existing_contract.id)
        is True
    )


def test_check_unique_nickname_unique(service):
    assert service.check_unique("nick_name", "no-such-nickname-xyz", None, None) is True


def test_check_unique_nickname_duplicate(service, loaded_db, existing_contract):
    existing_contract.nick_name = "uniqueness-test-nickname"
    loaded_db.commit()
    try:
        assert service.check_unique("nick_name", "uniqueness-test-nickname", None, None) is False
        # Same value with exclude_id excluding self -> unique
        assert (
            service.check_unique("nick_name", "uniqueness-test-nickname", None, exclude_id=existing_contract.id) is True
        )
    finally:
        existing_contract.nick_name = None
        loaded_db.commit()


def test_check_unique_empty_value_is_unique(service):
    assert service.check_unique("name", "", AgreementType.CONTRACT, None) is True
    assert service.check_unique("name", "   ", AgreementType.CONTRACT, None) is True
    assert service.check_unique("nick_name", "", None, None) is True


def test_check_unique_invalid_field_raises(service):
    with pytest.raises(ValidationError):
        service.check_unique("description", "x", None, None)


def test_endpoint_returns_unique_true(auth_client, existing_contract):
    url = url_for("api.agreements-check-unique")
    response = auth_client.get(
        url,
        query_string={
            "field": "name",
            "value": "Some title that does not exist anywhere",
            "agreement_type": "CONTRACT",
        },
    )
    assert response.status_code == 200
    assert response.json == {"unique": True}


def test_endpoint_returns_unique_false_for_duplicate_name(auth_client, existing_contract):
    url = url_for("api.agreements-check-unique")
    response = auth_client.get(
        url,
        query_string={
            "field": "name",
            "value": existing_contract.name,
            "agreement_type": "CONTRACT",
        },
    )
    assert response.status_code == 200
    assert response.json == {"unique": False}


def test_endpoint_excludes_self_via_exclude_id(auth_client, existing_contract):
    url = url_for("api.agreements-check-unique")
    response = auth_client.get(
        url,
        query_string={
            "field": "name",
            "value": existing_contract.name,
            "agreement_type": "CONTRACT",
            "exclude_id": existing_contract.id,
        },
    )
    assert response.status_code == 200
    assert response.json == {"unique": True}


def test_endpoint_invalid_field_returns_400(auth_client):
    url = url_for("api.agreements-check-unique")
    response = auth_client.get(url, query_string={"field": "description", "value": "x"})
    assert response.status_code == 400


def test_endpoint_missing_agreement_type_for_name_returns_400(auth_client):
    url = url_for("api.agreements-check-unique")
    response = auth_client.get(url, query_string={"field": "name", "value": "x"})
    assert response.status_code == 400


def test_endpoint_invalid_agreement_type_returns_400(auth_client):
    url = url_for("api.agreements-check-unique")
    response = auth_client.get(
        url,
        query_string={"field": "name", "value": "x", "agreement_type": "NOT_A_TYPE"},
    )
    assert response.status_code == 400


def test_endpoint_unauthenticated_returns_401(client):
    url = url_for("api.agreements-check-unique")
    response = client.get(
        url,
        query_string={"field": "name", "value": "x", "agreement_type": "CONTRACT"},
    )
    assert response.status_code == 401
