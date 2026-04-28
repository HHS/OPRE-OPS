from datetime import date
from decimal import Decimal

from flask import url_for

from models import (
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
)


def _cleanup(loaded_db, *items):
    """Delete committed objects so they do not leak into later tests."""
    for item in items:
        loaded_db.delete(item)
    loaded_db.commit()


class TestAgreementSpendingSerialization:
    """Tests for /agreements/<id>/spending/ endpoint serialization."""

    def test_agreement_spending_endpoint_returns_200(self, auth_client, loaded_db):
        """Valid agreement returns 200."""
        agreement = ContractAgreement(name="Spending 200 Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
        finally:
            _cleanup(loaded_db, agreement)

    def test_agreement_spending_all_required_fields_present(self, auth_client, loaded_db):
        """Response contains fy_total."""
        agreement = ContractAgreement(name="Spending Fields Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            assert "fy_total" in response.json
        finally:
            _cleanup(loaded_db, agreement)

    def test_agreement_spending_fy_total_structure(self, auth_client, loaded_db):
        """fy_total is a dict with integer-parseable string keys and Decimal-parseable string values."""
        agreement = ContractAgreement(name="Spending Structure Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("1000.00"),
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200

            fy_total = response.json["fy_total"]
            assert isinstance(fy_total, dict)
            for fy_str, total_str in fy_total.items():
                fy = int(fy_str)
                assert 2000 < fy < 3000
                assert isinstance(total_str, str)
                assert Decimal(total_str) >= 0
        finally:
            _cleanup(loaded_db, bli, agreement)

    def test_agreement_spending_404_for_nonexistent_agreement(self, auth_client, loaded_db):
        """Non-existent agreement returns 404."""
        response = auth_client.get(url_for("api.agreements-spending-item", id=999999))
        assert response.status_code == 404

    def test_agreement_spending_with_no_blis(self, auth_client, loaded_db):
        """Agreement with no BLIs returns an empty fy_total dict."""
        agreement = ContractAgreement(name="Spending Empty Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            assert response.json["fy_total"] == {}
        finally:
            _cleanup(loaded_db, agreement)

    def test_agreement_spending_with_multiple_fiscal_years(self, auth_client, loaded_db):
        """BLIs spanning FYs produce one entry per FY."""
        agreement = ContractAgreement(name="Spending Multi-FY Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        blis = [
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                amount=Decimal("1000.00"),
                date_needed=date(2023, 6, 1),
                status=BudgetLineItemStatus.PLANNED,
            ),
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                amount=Decimal("2000.00"),
                date_needed=date(2024, 6, 1),
                status=BudgetLineItemStatus.PLANNED,
            ),
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                amount=Decimal("3000.00"),
                date_needed=date(2025, 6, 1),
                status=BudgetLineItemStatus.PLANNED,
            ),
        ]
        loaded_db.add_all(blis)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200

            fy_total = response.json["fy_total"]
            assert Decimal(fy_total["2023"]) == Decimal("1000.00")
            assert Decimal(fy_total["2024"]) == Decimal("2000.00")
            assert Decimal(fy_total["2025"]) == Decimal("3000.00")
        finally:
            _cleanup(loaded_db, *blis, agreement)

    def test_agreement_spending_excludes_draft_blis(self, auth_client, loaded_db):
        """DRAFT BLIs are excluded from totals."""
        agreement = ContractAgreement(name="Spending Draft Exclusion Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli_planned = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("1000.00"),
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        bli_draft = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("5000.00"),
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.DRAFT,
        )
        loaded_db.add_all([bli_planned, bli_draft])
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            assert Decimal(response.json["fy_total"]["2024"]) == Decimal("1000.00")
        finally:
            _cleanup(loaded_db, bli_planned, bli_draft, agreement)

    def test_agreement_spending_includes_obe_draft_blis(self, auth_client, loaded_db):
        """OBE BLIs are included even if DRAFT."""
        agreement = ContractAgreement(name="Spending OBE Draft Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli_obe_draft = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("750.00"),
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.DRAFT,
            is_obe=True,
        )
        loaded_db.add(bli_obe_draft)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            assert Decimal(response.json["fy_total"]["2024"]) == Decimal("750.00")
        finally:
            _cleanup(loaded_db, bli_obe_draft, agreement)

    def test_agreement_spending_excludes_blis_with_no_fiscal_year(self, auth_client, loaded_db):
        """BLIs missing date_needed (no fiscal_year) are skipped."""
        agreement = ContractAgreement(name="Spending No FY Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli_no_date = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("9999.00"),
            date_needed=None,
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli_no_date)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            assert response.json["fy_total"] == {}
        finally:
            _cleanup(loaded_db, bli_no_date, agreement)

    def test_agreement_spending_includes_bli_fees(self, auth_client, loaded_db):
        """Totals include BLI fees."""
        agreement = ContractAgreement(name="Spending Fees Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("1000.00"),
            procurement_shop_fee_id=4,  # 4.8% fee in test data
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            expected = Decimal("1000.00") + Decimal("48.00")
            assert Decimal(response.json["fy_total"]["2024"]) == expected
        finally:
            _cleanup(loaded_db, bli, agreement)

    def test_agreement_spending_requires_authentication(self, client, loaded_db):
        """Unauthenticated requests return 401."""
        response = client.get(url_for("api.agreements-spending-item", id=1))
        assert response.status_code == 401

    def test_agreement_spending_aggregates_multiple_blis_in_same_fy(self, auth_client, loaded_db):
        """Multiple BLIs in the same fiscal year are summed into one entry."""
        agreement = ContractAgreement(name="Spending Same FY Aggregation Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        blis = [
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                amount=Decimal("1000.00"),
                date_needed=date(2024, 3, 15),
                status=BudgetLineItemStatus.PLANNED,
            ),
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                amount=Decimal("2500.00"),
                date_needed=date(2024, 6, 1),
                status=BudgetLineItemStatus.OBLIGATED,
            ),
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                amount=Decimal("500.00"),
                date_needed=date(2024, 8, 20),
                status=BudgetLineItemStatus.IN_EXECUTION,
            ),
        ]
        loaded_db.add_all(blis)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200

            fy_total = response.json["fy_total"]
            assert list(fy_total.keys()) == ["2024"]
            assert Decimal(fy_total["2024"]) == Decimal("4000.00")
        finally:
            _cleanup(loaded_db, *blis, agreement)

    def test_agreement_spending_handles_bli_with_no_amount(self, auth_client, loaded_db):
        """BLIs with amount=None are treated as 0 and still contribute fees if present."""
        agreement = ContractAgreement(name="Spending No Amount Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            amount=None,
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            # amount=None and no procurement_shop_fee → total is 0
            assert Decimal(response.json["fy_total"]["2024"]) == Decimal("0")
        finally:
            _cleanup(loaded_db, bli, agreement)

    def test_agreement_spending_works_for_grant_agreement(self, auth_client, loaded_db):
        """Non-contract agreement types (e.g., GrantAgreement with GrantBudgetLineItem) also aggregate correctly."""
        agreement = GrantAgreement(name="Spending Grant Type Test")
        loaded_db.add(agreement)
        loaded_db.commit()

        bli = GrantBudgetLineItem(
            agreement_id=agreement.id,
            amount=Decimal("2500.00"),
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-spending-item", id=agreement.id))
            assert response.status_code == 200
            assert Decimal(response.json["fy_total"]["2024"]) == Decimal("2500.00")
        finally:
            _cleanup(loaded_db, bli, agreement)
