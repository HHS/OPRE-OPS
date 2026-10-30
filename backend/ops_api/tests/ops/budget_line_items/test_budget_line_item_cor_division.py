"""Filtering Budget Lines by the division of their agreement's primary COR (#6457)."""

import math
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import select

from models import (
    CAN,
    AgreementType,
    BudgetLineItemStatus,
    BudgetLineSortCondition,
    ContractAgreement,
    ContractBudgetLineItem,
    Division,
    User,
    UserStatus,
)
from ops_api.ops.services.budget_line_items import BudgetLineItemService


@pytest.fixture()
def cor_division_data(loaded_db):
    """Self-contained divisions, CORs, agreements and BLIs, so assertions don't depend on seed data.

    | BLI      | Agreement's primary COR (division) | Alternate COR | Portfolio | FY   | Amount |
    |----------|------------------------------------|---------------|-----------|------|--------|
    | a1       | po_a (A)                           |               | P1        | 2043 | 100    |
    | a2       | po_a (A)                           |               | P2        | 2043 | 200    |
    | b        | po_b (B)                           |               | P1        | 2043 | 400    |
    | no_po    | none                               |               | P1        | 2043 | 800    |
    | alt_only | po_no_div (none)                   | alt_c (C)     | P1        | 2043 | 1600   |

    Division D has no COR at all. No agreement has a procurement shop, so every fee is 0.
    """
    divisions = {key: Division(name=f"BLI COR Division {key} (#6457)", abbreviation=f"BCD{key}6457") for key in "ABCD"}
    loaded_db.add_all(divisions.values())
    loaded_db.flush()

    users = {
        key: User(
            email=f"bli-cor-{key}-6457@example.com",
            first_name="BLI COR",
            last_name=key,
            division=division_id,
            status=UserStatus.ACTIVE,
        )
        for key, division_id in (
            ("po_a", divisions["A"].id),
            ("po_b", divisions["B"].id),
            ("alt_c", divisions["C"].id),
            ("po_no_div", None),
        )
    }
    loaded_db.add_all(users.values())
    loaded_db.flush()

    agreements = {
        key: ContractAgreement(
            name=f"BLI COR Division - Agreement {key} (#6457)",
            agreement_type=AgreementType.CONTRACT,
            project_officer_id=po_id,
            alternate_project_officer_id=alt_id,
        )
        for key, po_id, alt_id in (
            ("a", users["po_a"].id, None),
            ("b", users["po_b"].id, None),
            ("no_po", None, None),
            ("alt_only", users["po_no_div"].id, users["alt_c"].id),
        )
    }
    loaded_db.add_all(agreements.values())
    loaded_db.flush()

    cans = loaded_db.scalars(select(CAN).where(CAN.portfolio_id.isnot(None)).order_by(CAN.id)).all()
    can_p1 = cans[0]
    can_p2 = next(can for can in cans if can.portfolio_id != can_p1.portfolio_id)

    blis = {
        key: ContractBudgetLineItem(
            agreement_id=agreements[agreement_key].id,
            can_id=can.id,
            status=BudgetLineItemStatus.PLANNED,
            amount=amount,
            date_needed=date(2043, 1, 15),  # FY 2043
            line_description=f"BLI COR Division - BLI {key} (#6457)",
        )
        for key, agreement_key, can, amount in (
            ("a1", "a", can_p1, 100),
            ("a2", "a", can_p2, 200),
            ("b", "b", can_p1, 400),
            ("no_po", "no_po", can_p1, 800),
            ("alt_only", "alt_only", can_p1, 1600),
        )
    }
    loaded_db.add_all(blis.values())
    loaded_db.commit()

    yield {
        **{f"div_{key.lower()}_id": division.id for key, division in divisions.items()},
        **{f"{key}_id": bli.id for key, bli in blis.items()},
        "po_a_id": users["po_a"].id,
        "p1_id": can_p1.portfolio_id,
        "p1_division_id": can_p1.portfolio.division_id,
    }

    # get_list() leaves BLIs partially loaded (base-class columns only), so reload them before
    # deleting; otherwise versioning can't read the subclass columns during the flush.
    loaded_db.expire_all()
    for bli in blis.values():
        loaded_db.delete(bli)
    loaded_db.flush()
    for agreement in agreements.values():
        loaded_db.delete(agreement)
    for user in users.values():
        loaded_db.delete(user)
    # User.division is a bare FK column with no ORM relationship, so flush the user deletes
    # before removing divisions; SQLAlchemy can't infer that ordering itself.
    loaded_db.flush()
    for division in divisions.values():
        loaded_db.delete(division)
    loaded_db.commit()


def _fixture_bli_ids(data):
    return {data[f"{key}_id"] for key in ("a1", "a2", "b", "no_po", "alt_only")}


def _matching_ids(loaded_db, data, filters):
    """BLI ids from get_list() under the given filters, restricted to this fixture's BLIs."""
    results, _ = BudgetLineItemService(loaded_db).get_list({"limit": [1000], "offset": [0], **filters})
    return {bli.id for bli in results} & _fixture_bli_ids(data)


def _mock_user(user_id):
    user = MagicMock()
    user.id = user_id
    user.roles = []
    user.is_superuser = False
    return user


class TestBudgetLineItemCorDivisionFilter:
    def test_no_division_filter_returns_all(self, loaded_db, app_ctx, cor_division_data):
        assert _matching_ids(loaded_db, cor_division_data, {}) == _fixture_bli_ids(cor_division_data)

    def test_single_division_returns_only_matching_cor(self, loaded_db, app_ctx, cor_division_data):
        matching = _matching_ids(loaded_db, cor_division_data, {"division": [cor_division_data["div_a_id"]]})

        assert matching == {cor_division_data["a1_id"], cor_division_data["a2_id"]}

    def test_multiple_divisions_returns_union(self, loaded_db, app_ctx, cor_division_data):
        divisions = [cor_division_data["div_a_id"], cor_division_data["div_b_id"]]
        matching = _matching_ids(loaded_db, cor_division_data, {"division": divisions})

        assert matching == {cor_division_data[k] for k in ("a1_id", "a2_id", "b_id")}

    def test_no_cor_and_cor_without_division_excluded_only_when_filtering(self, loaded_db, app_ctx, cor_division_data):
        every_division = [cor_division_data[f"div_{key}_id"] for key in "abcd"]
        filtered = _matching_ids(loaded_db, cor_division_data, {"division": every_division})
        unfiltered = _matching_ids(loaded_db, cor_division_data, {})

        for key in ("no_po_id", "alt_only_id"):
            assert cor_division_data[key] in unfiltered
            assert cor_division_data[key] not in filtered

    def test_division_on_alternate_cor_only_is_excluded(self, loaded_db, app_ctx, cor_division_data):
        assert _matching_ids(loaded_db, cor_division_data, {"division": [cor_division_data["div_c_id"]]}) == set()

    def test_portfolio_division_does_not_match(self, loaded_db, app_ctx, cor_division_data):
        """BLIs funded from a portfolio in the chosen division are excluded when their COR isn't in it."""
        matching = _matching_ids(loaded_db, cor_division_data, {"division": [cor_division_data["p1_division_id"]]})

        assert matching == set()

    def test_unknown_division_returns_empty(self, loaded_db, app_ctx, cor_division_data):
        results, summary = BudgetLineItemService(loaded_db).get_list(
            {"division": [999999], "limit": [1000], "offset": [0]}
        )

        assert results == []
        assert summary["count"] == 0

    def test_division_with_portfolio_and_fiscal_year_is_intersection(self, loaded_db, app_ctx, cor_division_data):
        division_and_portfolio = {
            "division": [cor_division_data["div_a_id"]],
            "portfolio": [cor_division_data["p1_id"]],
        }

        def matching(extra_filters):
            return _matching_ids(loaded_db, cor_division_data, {**division_and_portfolio, **extra_filters})

        assert matching({}) == {cor_division_data["a1_id"]}
        assert matching({"fiscal_year": [2043]}) == {cor_division_data["a1_id"]}
        assert matching({"fiscal_year": [2044]}) == set()

    def test_division_applies_without_agreement_join(self, loaded_db, app_ctx, cor_division_data):
        """The default sort joins Agreement into the query; sorting by ID doesn't. The filter must work both ways."""
        matching = _matching_ids(
            loaded_db,
            cor_division_data,
            {"division": [cor_division_data["div_a_id"]], "sort_conditions": [BudgetLineSortCondition.ID_NUMBER]},
        )

        assert matching == {cor_division_data["a1_id"], cor_division_data["a2_id"]}

    def test_count_totals_and_paging_cover_only_filtered_set(self, loaded_db, app_ctx, cor_division_data):
        service = BudgetLineItemService(loaded_db)
        division_a = {"division": [cor_division_data["div_a_id"]]}

        first_page, summary = service.get_list({**division_a, "limit": [1], "offset": [0]})
        second_page, second_summary = service.get_list({**division_a, "limit": [1], "offset": [1]})

        assert summary["count"] == second_summary["count"] == 2
        assert summary["totals"]["total_amount"] == 300  # b's $400 and the others are excluded
        assert summary["totals"]["total_planned_amount"] == 300
        assert second_summary["totals"] == summary["totals"]
        assert len(first_page) == len(second_page) == 1
        assert {first_page[0].id, second_page[0].id} == {cor_division_data["a1_id"], cor_division_data["a2_id"]}

    @patch("ops_api.ops.services.budget_line_items.get_current_user")
    def test_division_and_only_my_together_is_intersection(self, mock_get_user, loaded_db, app_ctx, cor_division_data):
        """Division narrows "My Budget Lines"; it never adds BLIs the user isn't associated with."""
        mock_get_user.return_value = _mock_user(cor_division_data["po_a_id"])
        divisions = [cor_division_data["div_a_id"], cor_division_data["div_b_id"]]

        results, summary = BudgetLineItemService(loaded_db).get_list(
            {"division": divisions, "only_my": [True], "limit": [1000], "offset": [0]}
        )

        assert {bli.id for bli in results} == {cor_division_data["a1_id"], cor_division_data["a2_id"]}
        assert summary["count"] == 2

    def test_filter_options_cor_divisions_only_include_primary_cors(self, loaded_db, app_ctx, cor_division_data):
        cor_divisions = BudgetLineItemService(loaded_db).get_filter_options({})["cor_divisions"]
        cor_division_ids = {d["id"] for d in cor_divisions}

        assert cor_division_data["div_a_id"] in cor_division_ids
        assert cor_division_data["div_b_id"] in cor_division_ids
        assert cor_division_data["div_c_id"] not in cor_division_ids  # alternate COR only
        assert cor_division_data["div_d_id"] not in cor_division_ids  # no COR at all
        assert [d["name"] for d in cor_divisions] == sorted(d["name"] for d in cor_divisions)

    @patch("ops_api.ops.services.budget_line_items.get_current_user")
    def test_filter_options_cor_divisions_respect_only_my(self, mock_get_user, loaded_db, app_ctx, cor_division_data):
        mock_get_user.return_value = _mock_user(cor_division_data["po_a_id"])

        cor_divisions = BudgetLineItemService(loaded_db).get_filter_options({"only_my": [True]})["cor_divisions"]
        cor_division_ids = {d["id"] for d in cor_divisions}

        assert cor_division_data["div_a_id"] in cor_division_ids
        assert cor_division_data["div_b_id"] not in cor_division_ids


class TestBudgetLineItemCorDivisionApi:
    def test_division_param_narrows_list_and_meta(self, auth_client, app_ctx, cor_division_data):
        """The param must survive QueryParametersSchema (unknown=EXCLUDE) and drive _meta."""
        response = auth_client.get(
            "/api/v1/budget-line-items/",
            query_string={"division": cor_division_data["div_a_id"], "limit": 1, "offset": 0},
        )

        assert response.status_code == 200
        assert len(response.json) == 1
        assert response.json[0]["id"] in {cor_division_data["a1_id"], cor_division_data["a2_id"]}
        meta = response.json[0]["_meta"]
        assert meta["total_count"] == 2
        assert meta["number_of_pages"] == math.ceil(2 / 1)
        assert meta["total_amount"] == 300
        assert meta["query_parameters"] is not None and "division" in meta["query_parameters"]

    def test_non_integer_division_returns_400(self, auth_client, app_ctx):
        response = auth_client.get("/api/v1/budget-line-items/?division=abc&limit=10&offset=0")

        assert response.status_code == 400

    def test_filter_options_include_cor_divisions(self, system_owner_auth_client, app_ctx, cor_division_data):
        response = system_owner_auth_client.get("/api/v1/budget-line-items-filters/")

        assert response.status_code == 200
        div_a = next(d for d in response.json["cor_divisions"] if d["id"] == cor_division_data["div_a_id"])
        assert div_a == {
            "id": cor_division_data["div_a_id"],
            "name": "BLI COR Division A (#6457)",
            "abbreviation": "BCDA6457",
        }
