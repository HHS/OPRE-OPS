from datetime import date
from decimal import Decimal

from flask import url_for

from models import (
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    Project,
    ProjectType,
)


class TestProjectSpendingSerialization:
    """Tests for /projects/<id>/spending/ endpoint serialization"""

    def test_project_spending_endpoint_returns_200(self, auth_client, loaded_db):
        """Test that the spending endpoint returns 200 for a valid project."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

    def test_project_spending_all_required_fields_present(self, auth_client, loaded_db):
        """Test that all required fields from ProjectSpendingMetadataSchema are present."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

        data = response.json

        # Verify all required fields from ProjectSpendingMetadataSchema
        assert "total" in data
        assert "total_by_fiscal_year" in data
        assert "spending_type_by_fiscal_year" in data
        assert "agreements_by_fy" in data

    def test_project_spending_field_types(self, auth_client, loaded_db):
        """Test that all fields have correct types."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

        data = response.json

        # total should be a string (for decimal precision) or None
        assert data["total"] is None or isinstance(data["total"], str)

        # total_by_fiscal_year should be a dict with integer keys and string values
        assert isinstance(data["total_by_fiscal_year"], dict)
        for key, value in data["total_by_fiscal_year"].items():
            assert isinstance(key, str)  # JSON keys are always strings
            assert isinstance(value, str)  # Decimal serialized as string

        # spending_type_by_fiscal_year should be a dict
        assert isinstance(data["spending_type_by_fiscal_year"], dict)

        # agreements_by_fy should be a dict
        assert isinstance(data["agreements_by_fy"], dict)

    def test_project_spending_total_as_string(self, auth_client, loaded_db):
        """Test that total is returned as a string to preserve decimal precision."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

        data = response.json

        # If there's a total, it should be a string
        if data["total"] is not None:
            assert isinstance(data["total"], str)
            # Should be parseable as a Decimal
            parsed = Decimal(data["total"])
            assert parsed >= 0

    def test_project_spending_total_by_fiscal_year_structure(self, auth_client, loaded_db):
        """Test that total_by_fiscal_year has correct structure."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

        data = response.json
        total_by_fy = data["total_by_fiscal_year"]

        assert isinstance(total_by_fy, dict)

        # Each entry should have fiscal year (as string key) and decimal total (as string value)
        for fy_str, total_str in total_by_fy.items():
            # Key should be parseable as an integer (fiscal year)
            fy = int(fy_str)
            assert fy > 2000 and fy < 3000  # Reasonable fiscal year range

            # Value should be parseable as a Decimal
            total = Decimal(total_str)
            assert total >= 0

    def test_project_spending_spending_type_by_fiscal_year_structure(self, auth_client, loaded_db):
        """Test that spending_type_by_fiscal_year has correct structure."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

        data = response.json
        spending_by_type = data["spending_type_by_fiscal_year"]

        assert isinstance(spending_by_type, dict)

        # Each entry should map fiscal year to SpendingTypeBreakdownSchema
        for fy_str, breakdown in spending_by_type.items():
            # Key should be parseable as fiscal year
            fy = int(fy_str)
            assert fy > 2000 and fy < 3000

            # Value should have all four spending types
            assert "contract" in breakdown
            assert "grant" in breakdown
            assert "partner" in breakdown
            assert "direct_obligation" in breakdown

            # All values should be decimal strings
            for spending_type, amount_str in breakdown.items():
                assert isinstance(amount_str, str)
                amount = Decimal(amount_str)
                assert amount >= 0

    def test_project_spending_agreements_by_fy_structure(self, auth_client, loaded_db):
        """Test that agreements_by_fy has correct structure."""
        response = auth_client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 200

        data = response.json
        agreements_by_fy = data["agreements_by_fy"]

        assert isinstance(agreements_by_fy, dict)

        # Each entry should map fiscal year to list of agreement IDs
        for fy_str, agreement_ids in agreements_by_fy.items():
            # Key should be parseable as fiscal year
            fy = int(fy_str)
            assert fy > 2000 and fy < 3000

            # Value should be a list of integers (agreement IDs)
            assert isinstance(agreement_ids, list)
            for agreement_id in agreement_ids:
                assert isinstance(agreement_id, int)
                assert agreement_id > 0

    def test_project_spending_404_for_nonexistent_project(self, auth_client, loaded_db):
        """Test that requesting spending for non-existent project returns 404."""
        response = auth_client.get(url_for("api.projects-spending-item", id=999999))
        assert response.status_code == 404

    def test_project_spending_with_no_agreements(self, auth_client, loaded_db):
        """Test spending endpoint for project with no agreements."""
        # Create a project with no agreements
        project = Project(
            project_type=ProjectType.RESEARCH,
            title="Project With No Agreements For Spending Test",
            short_title="PNAFST",
            description="Test project with no agreements",
        )
        loaded_db.add(project)
        loaded_db.commit()
        loaded_db.refresh(project)

        response = auth_client.get(url_for("api.projects-spending-item", id=project.id))
        assert response.status_code == 200

        data = response.json

        # Should have zero total
        assert data["total"] == "0"

        # Should have empty collections
        assert data["total_by_fiscal_year"] == {}
        assert data["spending_type_by_fiscal_year"] == {}
        assert data["agreements_by_fy"] == {}

    def test_project_spending_with_multiple_fiscal_years(self, auth_client, loaded_db):
        """Test spending endpoint for project with BLIs across multiple fiscal years."""
        # Create a new project
        project = Project(
            project_type=ProjectType.RESEARCH,
            title="Multi-FY Spending Test Project",
            short_title="MFYSTP",
            description="Project with spending across multiple fiscal years",
        )
        loaded_db.add(project)
        loaded_db.commit()

        # Create an agreement
        agreement = ContractAgreement(
            name="Multi-FY Agreement",
            project_id=project.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Add BLIs for different fiscal years
        bli_2023 = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("1000.00"),
            date_needed=date(2023, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        bli_2024 = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("2000.00"),
            date_needed=date(2024, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        bli_2025 = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("3000.00"),
            date_needed=date(2025, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add_all([bli_2023, bli_2024, bli_2025])
        loaded_db.commit()

        response = auth_client.get(url_for("api.projects-spending-item", id=project.id))
        assert response.status_code == 200

        data = response.json

        # Should have all three fiscal years in total_by_fiscal_year
        assert "2023" in data["total_by_fiscal_year"]
        assert "2024" in data["total_by_fiscal_year"]
        assert "2025" in data["total_by_fiscal_year"]

        # Verify amounts
        assert Decimal(data["total_by_fiscal_year"]["2023"]) == Decimal("1000.00")
        assert Decimal(data["total_by_fiscal_year"]["2024"]) == Decimal("2000.00")
        assert Decimal(data["total_by_fiscal_year"]["2025"]) == Decimal("3000.00")

        # Total should be sum of all fiscal years
        assert Decimal(data["total"]) == Decimal("6000.00")

        # All fiscal years should have spending breakdown
        assert "2023" in data["spending_type_by_fiscal_year"]
        assert "2024" in data["spending_type_by_fiscal_year"]
        assert "2025" in data["spending_type_by_fiscal_year"]

        # All fiscal years should list the agreement
        assert "2023" in data["agreements_by_fy"]
        assert "2024" in data["agreements_by_fy"]
        assert "2025" in data["agreements_by_fy"]
        assert agreement.id in data["agreements_by_fy"]["2023"]
        assert agreement.id in data["agreements_by_fy"]["2024"]
        assert agreement.id in data["agreements_by_fy"]["2025"]

    def test_project_spending_excludes_draft_blis(self, auth_client, loaded_db):
        """Test that DRAFT BLIs are excluded from spending calculations."""
        # Create a new project
        project = Project(
            project_type=ProjectType.RESEARCH,
            title="Draft BLI Exclusion Test Project",
            short_title="DBETP",
            description="Test project for draft BLI exclusion",
        )
        loaded_db.add(project)
        loaded_db.commit()

        # Create an agreement
        agreement = ContractAgreement(
            name="Draft Test Agreement",
            project_id=project.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Add one PLANNED BLI and one DRAFT BLI
        bli_planned = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("1000.00"),
            date_needed=date(2023, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        bli_draft = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("5000.00"),  # Large amount that should be excluded
            date_needed=date(2023, 6, 1),
            status=BudgetLineItemStatus.DRAFT,
        )
        loaded_db.add_all([bli_planned, bli_draft])
        loaded_db.commit()

        response = auth_client.get(url_for("api.projects-spending-item", id=project.id))
        assert response.status_code == 200

        data = response.json

        # Total should only include the PLANNED BLI, not the DRAFT
        assert Decimal(data["total"]) == Decimal("1000.00")
        assert Decimal(data["total_by_fiscal_year"]["2023"]) == Decimal("1000.00")

    def test_project_spending_includes_bli_fees(self, auth_client, loaded_db):
        """Test that BLI fees are included in spending totals."""
        # Create a new project
        project = Project(
            project_type=ProjectType.RESEARCH,
            title="BLI Fees Test Project",
            short_title="BFTP",
            description="Test project for BLI fee inclusion",
        )
        loaded_db.add(project)
        loaded_db.commit()

        # Create an agreement
        agreement = ContractAgreement(
            name="Fees Test Agreement",
            project_id=project.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Add BLI with amount and fees
        bli = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("1000.00"),
            procurement_shop_fee_id=4,  # Proc shop id 4 corresponds to the 4.8% fee in the test data
            # fees=Decimal("48.00"),  # 4.8% fee
            date_needed=date(2023, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        response = auth_client.get(url_for("api.projects-spending-item", id=project.id))
        assert response.status_code == 200

        data = response.json

        # Total should include both amount and fees
        expected_total = Decimal("1000.00") + Decimal("48.00")
        assert Decimal(data["total"]) == expected_total
        assert Decimal(data["total_by_fiscal_year"]["2023"]) == expected_total

    def test_project_spending_requires_authentication(self, client, loaded_db):
        """Test that the spending endpoint requires authentication."""
        response = client.get(url_for("api.projects-spending-item", id=1002))
        assert response.status_code == 401

    def test_project_spending_contract_type_breakdown(self, auth_client, loaded_db):
        """Test that spending is correctly categorized by contract type."""
        # Create a new project
        project = Project(
            project_type=ProjectType.RESEARCH,
            title="Contract Type Breakdown Test",
            short_title="CTBT",
            description="Test project for contract type spending breakdown",
        )
        loaded_db.add(project)
        loaded_db.commit()

        # Create contract agreement
        contract_agreement = ContractAgreement(
            name="Contract Agreement",
            project_id=project.id,
        )
        loaded_db.add(contract_agreement)
        loaded_db.commit()

        # Add BLI for contract
        bli_contract = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=contract_agreement.id,
            amount=Decimal("1000.00"),
            date_needed=date(2023, 6, 1),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli_contract)
        loaded_db.commit()

        response = auth_client.get(url_for("api.projects-spending-item", id=project.id))
        assert response.status_code == 200

        data = response.json

        # Verify contract spending is tracked
        assert "2023" in data["spending_type_by_fiscal_year"]
        breakdown = data["spending_type_by_fiscal_year"]["2023"]
        assert Decimal(breakdown["contract"]) == Decimal("1000.00")
        assert Decimal(breakdown["grant"]) == Decimal("0")
        assert Decimal(breakdown["partner"]) == Decimal("0")
        assert Decimal(breakdown["direct_obligation"]) == Decimal("0")
