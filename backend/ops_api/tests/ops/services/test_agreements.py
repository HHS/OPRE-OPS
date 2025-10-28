from unittest.mock import MagicMock, patch

import pytest

from models import (
    AaAgreement,
    Agreement,
    BudgetLineItem,
    BudgetLineItemStatus,
    ChangeRequestType,
    ContractAgreement,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
)
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.ops_service import ValidationError


@pytest.fixture
def service(loaded_db):
    return AgreementsService(loaded_db)


def make_agreement(awarding_entity_id, blis):
    agreement = Agreement()
    agreement.awarding_entity_id = awarding_entity_id
    agreement.budget_line_items = blis
    return agreement


def make_bli(status):
    bli = BudgetLineItem()
    bli.status = status
    return bli


def test_no_change_if_same_awarding_entity(service):
    agreement = make_agreement(awarding_entity_id=1, blis=[])
    result = service._handle_proc_shop_change(agreement, new_value=1)
    assert result is None


@pytest.mark.parametrize(
    "status",
    [
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_raise_error_if_bli_status_is_execution_or_higher(service, status):
    blis = [make_bli(status)]
    agreement = make_agreement(awarding_entity_id=1, blis=blis)
    with pytest.raises(ValidationError):
        service._handle_proc_shop_change(agreement, new_value=2)


def test_immediate_change_with_all_draft_and_update_fees(service):
    blis = [make_bli(BudgetLineItemStatus.DRAFT), make_bli(BudgetLineItemStatus.DRAFT)]
    agreement = make_agreement(awarding_entity_id=1, blis=blis)

    with patch.object(service, "_update_draft_blis_proc_shop_fees"):
        result = service._handle_proc_shop_change(agreement, new_value=5)

    assert agreement.awarding_entity_id == 5
    assert result is None


@patch("ops_api.ops.services.agreements.get_current_user")
@patch("ops_api.ops.services.agreements.ChangeRequestService")
@patch("ops_api.ops.services.agreements.OpsEventHandler")
def test_creates_change_request_when_planned_bli(
    mock_event_handler, mock_cr_service, mock_get_user, service
):
    blis = [
        make_bli(BudgetLineItemStatus.PLANNED),
        make_bli(BudgetLineItemStatus.DRAFT),
    ]
    agreement = make_agreement(awarding_entity_id=1, blis=blis)

    mock_user = MagicMock()
    mock_user.id = 99
    mock_get_user.return_value = mock_user

    mock_cr = MagicMock()
    mock_cr.create.return_value.id = 101
    mock_cr_service.return_value = mock_cr

    mock_cm = MagicMock(metadata={})
    mock_event_handler.return_value.__enter__.return_value = mock_cm
    mock_event_handler.return_value.__exit__.return_value = False

    result = service._handle_proc_shop_change(agreement, new_value=7)

    mock_cr.create.assert_called_once_with(
        {
            "agreement_id": agreement.id,
            "requested_change_data": {"awarding_entity_id": 7},
            "requested_change_diff": {"awarding_entity_id": {"new": 7, "old": 1}},
            "created_by": 99,
            "change_request_type": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        }
    )
    assert result == 101


# ====================================
# Pagination Tests (Iteration 2.1)
# ====================================


@pytest.mark.usefixtures("app_ctx")
class TestAgreementsPagination:
    """Test suite for pagination functionality in AgreementsService.get_list()"""

    # Task 2.1.2: Test pagination slicing logic

    def test_pagination_returns_first_page_with_default_limit(self, loaded_db):
        """Test that default limit of 10 returns first 10 results"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]
        data = {}  # No pagination params, should use defaults

        results, metadata = service.get_list(agreement_classes, data)

        assert len(results) <= 10
        assert metadata["limit"] == 10
        assert metadata["offset"] == 0

    def test_pagination_with_custom_limit(self, loaded_db):
        """Test pagination with custom limit value"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]
        data = {"limit": [5], "offset": [0]}

        results, metadata = service.get_list(agreement_classes, data)

        assert len(results) <= 5
        assert metadata["limit"] == 5
        assert metadata["offset"] == 0

    def test_pagination_with_offset(self, loaded_db):
        """Test pagination with offset to get second page"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]

        # Get first page
        data_page1 = {"limit": [5], "offset": [0]}
        results_page1, _ = service.get_list(agreement_classes, data_page1)

        # Get second page
        data_page2 = {"limit": [5], "offset": [5]}
        results_page2, metadata_page2 = service.get_list(agreement_classes, data_page2)

        # Verify offset is applied
        assert metadata_page2["offset"] == 5
        assert metadata_page2["limit"] == 5

        # Verify results are different (if enough data exists)
        if len(results_page1) > 0 and len(results_page2) > 0:
            assert results_page1[0].id != results_page2[0].id

    def test_pagination_with_limit_exceeding_results(self, loaded_db):
        """Test pagination when limit exceeds total results"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]
        data = {"limit": [100], "offset": [0]}

        results, metadata = service.get_list(agreement_classes, data)

        # Should return all results without error
        assert len(results) <= 100
        assert metadata["limit"] == 100
        assert metadata["offset"] == 0
        assert len(results) == metadata["count"]  # All results returned

    def test_pagination_with_offset_beyond_results(self, loaded_db):
        """Test pagination when offset exceeds total results"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]
        data = {"limit": [10], "offset": [1000]}

        results, metadata = service.get_list(agreement_classes, data)

        # Should return empty list without error
        assert len(results) == 0
        assert metadata["offset"] == 1000
        assert metadata["count"] >= 0  # Total count should still be correct

    def test_pagination_boundary_last_page(self, loaded_db):
        """Test pagination on the last page with partial results"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]

        # Get total count first
        data_all = {"limit": [100], "offset": [0]}
        _, metadata_all = service.get_list(agreement_classes, data_all)
        total_count = metadata_all["count"]

        if total_count > 5:
            # Request last page with limit that will partially fill
            offset = total_count - 3
            data = {"limit": [10], "offset": [offset]}
            results, metadata = service.get_list(agreement_classes, data)

            assert len(results) == 3
            assert metadata["offset"] == offset
            assert metadata["count"] == total_count

    # Task 2.1.3: Test metadata calculation

    def test_metadata_count_reflects_total_before_pagination(self, loaded_db):
        """Test that metadata count shows total results, not paginated count"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]

        # Get small page
        data = {"limit": [2], "offset": [0]}
        results, metadata = service.get_list(agreement_classes, data)

        # Count should be total, not just what was returned
        assert metadata["count"] >= len(results)
        assert len(results) <= 2

    def test_metadata_contains_all_required_fields(self, loaded_db):
        """Test that metadata contains count, limit, and offset"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]
        data = {"limit": [10], "offset": [0]}

        _, metadata = service.get_list(agreement_classes, data)

        assert "count" in metadata
        assert "limit" in metadata
        assert "offset" in metadata
        assert isinstance(metadata["count"], int)
        assert isinstance(metadata["limit"], int)
        assert isinstance(metadata["offset"], int)

    def test_metadata_count_consistent_across_pages(self, loaded_db):
        """Test that total count remains consistent across different pages"""
        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]

        # Get count from first page
        data_page1 = {"limit": [5], "offset": [0]}
        _, metadata_page1 = service.get_list(agreement_classes, data_page1)

        # Get count from second page
        data_page2 = {"limit": [5], "offset": [5]}
        _, metadata_page2 = service.get_list(agreement_classes, data_page2)

        # Total count should be the same
        assert metadata_page1["count"] == metadata_page2["count"]

    # Task 2.1.4: Test with multiple agreement types

    def test_pagination_with_single_agreement_type(self, loaded_db):
        """Test pagination works with just one agreement type"""
        service = AgreementsService(loaded_db)
        agreement_classes = [ContractAgreement]
        data = {"limit": [5], "offset": [0]}

        results, metadata = service.get_list(agreement_classes, data)

        assert len(results) <= 5
        assert all(isinstance(agr, ContractAgreement) for agr in results)
        assert metadata["count"] >= 0

    def test_pagination_combines_multiple_agreement_types(self, loaded_db):
        """Test that pagination correctly combines results from multiple agreement types"""
        service = AgreementsService(loaded_db)

        # Get counts for individual types
        contract_results, contract_meta = service.get_list(
            [ContractAgreement], {"limit": [100]}
        )
        grant_results, grant_meta = service.get_list([GrantAgreement], {"limit": [100]})

        # Get combined results
        combined_results, combined_meta = service.get_list(
            [ContractAgreement, GrantAgreement], {"limit": [100]}
        )

        # Combined count should equal sum of individual counts
        expected_total = contract_meta["count"] + grant_meta["count"]
        assert combined_meta["count"] == expected_total

    # Task 2.1.5: Test with ownership filter

    @patch("ops_api.ops.utils.agreements_helpers.get_current_user")
    def test_pagination_with_ownership_filter(self, mock_get_user, loaded_db):
        """Test that pagination works with ownership filter"""
        # Mock authenticated user
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]
        data = {"only_my": [True], "limit": [10], "offset": [0]}

        results, metadata = service.get_list(agreement_classes, data)

        # Should return results and metadata without error
        assert isinstance(results, list)
        assert "count" in metadata
        assert metadata["limit"] == 10
        assert metadata["offset"] == 0

    @patch("ops_api.ops.utils.agreements_helpers.get_current_user")
    def test_pagination_ownership_filter_affects_count(self, mock_get_user, loaded_db):
        """Test that ownership filter changes the total count appropriately"""
        # Mock authenticated user
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        service = AgreementsService(loaded_db)
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            DirectAgreement,
            AaAgreement,
        ]

        # Get all results
        data_all = {"limit": [100], "offset": [0]}
        _, metadata_all = service.get_list(agreement_classes, data_all)

        # Get filtered results
        data_filtered = {"only_my": [True], "limit": [100], "offset": [0]}
        _, metadata_filtered = service.get_list(agreement_classes, data_filtered)

        # Filtered count should be <= total count
        assert metadata_filtered["count"] <= metadata_all["count"]
