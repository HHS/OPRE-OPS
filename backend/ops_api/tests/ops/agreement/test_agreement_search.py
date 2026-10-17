import pytest
from flask import url_for
from sqlalchemy import func, select

from models import (
    AaAgreement,
    AgreementType,
    ContractAgreement,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
    IAADirectionType,
    OpsEvent,
)

SEARCH_RESULT_KEYS = {"id", "name", "nick_name", "agreement_type", "odn"}


@pytest.fixture
def search_agreements(loaded_db):
    """One agreement of each type, with ZQX-prefixed values no seed data contains.

    Values are deliberately cross-wired to prove only the ODN column for each type is searched:
    the contract's task_order_number and contract_number, and the AA's po_number, carry tokens
    that must never match.
    """
    contract = ContractAgreement(
        name="Zqx Contract Alpha",
        nick_name="ZQX-NICK-CONTRACT",
        agreement_type=AgreementType.CONTRACT,
        po_number="ZQX-PO-1001",
        task_order_number="ZQX-WRONG-TO",
        contract_number="ZQX-WRONG-CONTRACT-NO",
    )
    aa = AaAgreement(
        name="Zqx Assisted Beta",
        agreement_type=AgreementType.AA,
        requesting_agency_id=1,
        servicing_agency_id=1,
        task_order_number="ZQX-TO-2002",
        po_number="ZQX-WRONG-PO",
    )
    grant = GrantAgreement(
        name="zqx grant gamma",
        agreement_type=AgreementType.GRANT,
        awarded_grant_number="ZQX-GRANT-3003",
    )
    iaa = IaaAgreement(
        name="Zqx Iaa Delta",
        nick_name="ZQX-NICK-IAA",
        agreement_type=AgreementType.IAA,
        direction=IAADirectionType.INCOMING,
    )
    direct = DirectAgreement(name="Banana Direct", agreement_type=AgreementType.DIRECT_OBLIGATION)
    agreements = [contract, aa, grant, iaa, direct]
    loaded_db.add_all(agreements)
    loaded_db.commit()

    yield {"contract": contract, "aa": aa, "grant": grant, "iaa": iaa, "direct": direct}

    for agreement in agreements:
        loaded_db.delete(agreement)
    loaded_db.commit()


def _search(client, q, **params):
    return client.get(url_for("api.agreements-search"), query_string={"q": q, **params})


def _ids(response):
    return [row["id"] for row in response.json["data"]]


class TestAgreementSearchMatching:
    def test_matches_odn_for_each_type(self, auth_client, search_agreements, app_ctx):
        for q, key in [("ZQX-PO-1001", "contract"), ("ZQX-TO-2002", "aa"), ("ZQX-GRANT-3003", "grant")]:
            response = _search(auth_client, q)
            assert response.status_code == 200
            assert _ids(response) == [search_agreements[key].id]
            assert response.json["data"][0]["odn"] == q

    def test_odn_match_is_partial_and_case_insensitive(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "po-100")
        assert _ids(response) == [search_agreements["contract"].id]
        response = _search(auth_client, "grant-30")
        assert _ids(response) == [search_agreements["grant"].id]

    def test_matches_name_case_insensitively(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "ZQX GRANT")
        assert _ids(response) == [search_agreements["grant"].id]
        response = _search(auth_client, "assisted BETA")
        assert _ids(response) == [search_agreements["aa"].id]

    def test_matches_nickname(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "nick-contract")
        assert _ids(response) == [search_agreements["contract"].id]
        response = _search(auth_client, "NICK-IAA")
        assert _ids(response) == [search_agreements["iaa"].id]

    def test_iaa_and_direct_match_on_name_with_null_odn(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "Banana")
        assert _ids(response) == [search_agreements["direct"].id]
        assert response.json["data"][0]["odn"] is None
        assert response.json["data"][0]["agreement_type"] == "DIRECT_OBLIGATION"

        response = _search(auth_client, "Iaa Delta")
        assert response.json["data"][0]["odn"] is None
        assert response.json["data"][0]["agreement_type"] == "IAA"

    @pytest.mark.parametrize("q", ["ZQX-WRONG-TO", "ZQX-WRONG-PO", "ZQX-WRONG-CONTRACT-NO"])
    def test_other_identifier_columns_are_not_searched(self, auth_client, search_agreements, app_ctx, q):
        response = _search(auth_client, q)
        assert response.status_code == 200
        assert response.json["count"] == 0
        assert response.json["data"] == []

    def test_agreement_matching_on_several_fields_is_returned_once(self, auth_client, search_agreements, app_ctx):
        # "ZQX-PO-1001" is the contract's ODN; "Zqx Contract" is its name; "ZQX" matches many fields.
        response = _search(auth_client, "ZQX", limit=50)
        ids = _ids(response)
        assert len(ids) == len(set(ids))
        assert response.json["count"] == len(ids)
        assert search_agreements["contract"].id in ids

    @pytest.mark.parametrize("q", ["%", "_", "ZQX_PO", "ZQX%1001", "ZQX\\PO", "\\"])
    def test_wildcards_and_backslash_are_literal(self, auth_client, search_agreements, app_ctx, q):
        # No fixture value contains these characters, so no fixture row may match
        # (an unescaped % or _ would match them).
        response = _search(auth_client, q)
        assert response.status_code == 200
        fixture_ids = {agreement.id for agreement in search_agreements.values()}
        assert fixture_ids.isdisjoint(_ids(response))
        for row in response.json["data"]:
            haystack = " ".join(str(row[key]) for key in ("name", "nick_name", "odn")).lower()
            assert q.lower() in haystack

    def test_q_is_trimmed(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "  ZQX-PO-1001  ")
        assert _ids(response) == [search_agreements["contract"].id]

    def test_response_shape(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "ZQX-PO-1001")
        assert set(response.json.keys()) == {"data", "count", "limit", "offset"}
        assert set(response.json["data"][0].keys()) == SEARCH_RESULT_KEYS
        assert response.json["limit"] == 10
        assert response.json["offset"] == 0


class TestAgreementSearchOrderingAndPagination:
    def test_ordered_case_insensitively_by_name(self, auth_client, search_agreements, app_ctx):
        response = _search(auth_client, "ZQX", limit=50)
        names = [row["name"] for row in response.json["data"]]
        assert names == sorted(names, key=str.casefold)
        # lowercase "zqx grant gamma" sorts among the capitalized names, not after them
        assert names.index("zqx grant gamma") < names.index("Zqx Iaa Delta")

    def test_equal_names_are_ordered_by_id_and_paginate_without_overlap(self, auth_client, loaded_db, app_ctx):
        twins = [
            DirectAgreement(name=name, agreement_type=AgreementType.DIRECT_OBLIGATION)
            for name in ("Zqxtie Twin", "ZQXTIE twin", "zqxtie TWIN", "Zqxtie Twin", "ZQXTIE TWIN")
        ]
        loaded_db.add_all(twins)
        loaded_db.commit()
        try:
            expected = sorted(twin.id for twin in twins)
            assert _ids(_search(auth_client, "zqxtie", limit=50)) == expected
            paged = []
            for offset in range(len(expected)):
                paged += _ids(_search(auth_client, "zqxtie", limit=1, offset=offset))
            assert paged == expected
        finally:
            for twin in twins:
                loaded_db.delete(twin)
            loaded_db.commit()

    def test_pagination_pages_and_count(self, auth_client, search_agreements, app_ctx):
        full = _search(auth_client, "ZQX", limit=50)
        total = full.json["count"]
        assert total >= 4

        first = _search(auth_client, "ZQX", limit=2, offset=0)
        second = _search(auth_client, "ZQX", limit=2, offset=2)
        assert first.json["count"] == second.json["count"] == total
        assert _ids(first) + _ids(second) == _ids(full)[:4]

    def test_count_is_correct_when_offset_is_past_the_end(self, auth_client, search_agreements, app_ctx):
        total = _search(auth_client, "ZQX", limit=50).json["count"]
        response = _search(auth_client, "ZQX", limit=5, offset=1000)
        assert response.status_code == 200
        assert response.json["data"] == []
        assert response.json["count"] == total


class TestAgreementSearchValidation:
    @pytest.mark.parametrize("params", [{}, {"q": ""}, {"q": "   "}, {"q": "x" * 101}])
    def test_invalid_q_is_400(self, auth_client, app_ctx, params):
        response = auth_client.get(url_for("api.agreements-search"), query_string=params)
        assert response.status_code == 400

    def test_q_with_nul_character_is_400(self, auth_client, app_ctx):
        assert _search(auth_client, "ab\x00cd").status_code == 400

    def test_offset_of_bigint_max_is_ok(self, auth_client, app_ctx):
        response = _search(auth_client, "x", offset=2**63 - 1)
        assert response.status_code == 200
        assert response.json["data"] == []

    def test_q_of_exactly_100_characters_is_ok(self, auth_client, app_ctx):
        assert _search(auth_client, "x" * 100).status_code == 200

    @pytest.mark.parametrize(
        "params",
        [
            {"limit": 0},
            {"limit": 51},
            {"limit": ""},
            {"limit": "abc"},
            {"offset": -1},
            {"offset": ""},
            {"offset": 2**63},
            {"offset": "99999999999999999999"},
        ],
    )
    def test_invalid_pagination_is_400(self, auth_client, app_ctx, params):
        assert _search(auth_client, "ZQX", **params).status_code == 400


class TestAgreementSearchAuth:
    def test_requires_authentication(self, client, app_ctx):
        assert _search(client, "ZQX").status_code == 401

    def test_requires_get_agreement_permission(self, no_perms_auth_client, app_ctx):
        assert _search(no_perms_auth_client, "ZQX").status_code == 403


class TestAgreementSearchSideEffects:
    def test_does_not_write_an_ops_event(self, auth_client, loaded_db, search_agreements, app_ctx):
        before = loaded_db.scalar(select(func.count()).select_from(OpsEvent))
        assert _search(auth_client, "ZQX").status_code == 200
        loaded_db.expire_all()
        after = loaded_db.scalar(select(func.count()).select_from(OpsEvent))
        assert after == before


class TestExactOdnFilterRegression:
    """The exact `odn` filter on GET /agreements/ must behave the same after sharing _odn_column."""

    def test_exact_odn_still_matches_only_whole_value(self, auth_client, search_agreements, app_ctx):
        exact = auth_client.get(url_for("api.agreements-group"), query_string={"odn": "ZQX-PO-1001"})
        assert exact.json["count"] == 1
        partial = auth_client.get(url_for("api.agreements-group"), query_string={"odn": "ZQX-PO"})
        assert partial.json["count"] == 0

    def test_exact_odn_never_matches_iaa_or_direct(self, auth_client, search_agreements, app_ctx):
        response = auth_client.get(url_for("api.agreements-group"), query_string={"odn": "Banana Direct"})
        assert response.json["count"] == 0
