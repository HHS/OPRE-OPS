from unittest.mock import MagicMock, patch

import pytest

from models import (
    AaAgreement,
    Agreement,
    AgreementReason,
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


def test_create_with_bad_research_methodologies(service):
    create_request = {
        "agreement_cls": ContractAgreement,
        "name": "Test Agreement",
        "agreement_reason": AgreementReason.NEW_REQ,
        "project_id": 1000,
        "budget_line_items": [
            {
                "line_description": "Year 1",
                "amount": 500000.00,
                "can_id": 500,
                "status": BudgetLineItemStatus.DRAFT,
                # Note: no services_component_ref or services_component_id
            },
            {
                "line_description": "Year 2",
                "amount": 525000.00,
                "can_id": 501,
                "status": BudgetLineItemStatus.DRAFT,
            },
        ],
        "research_methodologies": [
            {
                "id": 9999,
                "name": "Knowledge Development",
                "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
            }  # Invalid ID
        ],
    }

    with pytest.raises(ValidationError) as exc_info:
        service.create(create_request)

    create_request = {
        "agreement_cls": ContractAgreement,
        "name": "Test Agreement",
        "agreement_reason": AgreementReason.NEW_REQ,
        "project_id": 1000,
        "budget_line_items": [
            {
                "line_description": "Year 1",
                "amount": 500000.00,
                "can_id": 500,
                "status": BudgetLineItemStatus.DRAFT,
                # Note: no services_component_ref or services_component_id
            },
            {
                "line_description": "Year 2",
                "amount": 525000.00,
                "can_id": 501,
                "status": BudgetLineItemStatus.DRAFT,
            },
        ],
        "research_methodologies": [
            {
                "id": 1,
                "name": "Nonexistent Method",
                "detailed_name": "Nonexistent Method (Lit Review, Expert Consultations)",
            }  # Invalid ID
        ],
    }

    with pytest.raises(ValidationError) as exc_info:
        service.create(create_request)

    assert "research_methodologies" in exc_info.value.validation_errors

    create_request = {
        "agreement_cls": ContractAgreement,
        "name": "Test Agreement",
        "agreement_reason": AgreementReason.NEW_REQ,
        "project_id": 1000,
        "budget_line_items": [
            {
                "line_description": "Year 1",
                "amount": 500000.00,
                "can_id": 500,
                "status": BudgetLineItemStatus.DRAFT,
                # Note: no services_component_ref or services_component_id
            },
            {
                "line_description": "Year 2",
                "amount": 525000.00,
                "can_id": 501,
                "status": BudgetLineItemStatus.DRAFT,
            },
        ],
        "research_methodologies": [
            {
                "id": 1,
                "name": "Knowledge Development",
                "detailed_name": "Knowledge Development (Not, Right, Answer)",
            }  # Invalid ID
        ],
    }

    with pytest.raises(ValidationError) as exc_info:
        service.create(create_request)

    assert "research_methodologies" in exc_info.value.validation_errors


@patch("ops_api.ops.services.agreements.get_current_user")
@patch("ops_api.ops.services.agreements.ChangeRequestService")
@patch("ops_api.ops.services.agreements.OpsEventHandler")
def test_creates_change_request_when_planned_bli(mock_event_handler, mock_cr_service, mock_get_user, service):
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


class TestAgreementsPagination:
    """Test suite for pagination functionality in AgreementsService.get_list()"""

    def test_pagination_returns_first_page_with_default_limit(self, loaded_db, app_ctx):
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

    def test_pagination_with_custom_limit(self, loaded_db, app_ctx):
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

    def test_pagination_with_offset(self, loaded_db, app_ctx):
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

    def test_pagination_with_limit_exceeding_results(self, loaded_db, app_ctx):
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

    def test_pagination_with_offset_beyond_results(self, loaded_db, app_ctx):
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

    def test_pagination_boundary_last_page(self, loaded_db, app_ctx):
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

    def test_metadata_count_reflects_total_before_pagination(self, loaded_db, app_ctx):
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

    def test_metadata_contains_all_required_fields(self, loaded_db, app_ctx):
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

    def test_metadata_count_consistent_across_pages(self, loaded_db, app_ctx):
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

    def test_pagination_with_single_agreement_type(self, loaded_db, app_ctx):
        """Test pagination works with just one agreement type"""
        service = AgreementsService(loaded_db)
        agreement_classes = [ContractAgreement]
        data = {"limit": [5], "offset": [0]}

        results, metadata = service.get_list(agreement_classes, data)

        assert len(results) <= 5
        assert all(isinstance(agr, ContractAgreement) for agr in results)
        assert metadata["count"] >= 0

    def test_pagination_combines_multiple_agreement_types(self, loaded_db, app_ctx):
        """Test that pagination correctly combines results from multiple agreement types"""
        service = AgreementsService(loaded_db)

        # Get counts for individual types
        contract_results, contract_meta = service.get_list([ContractAgreement], {"limit": [100]})
        grant_results, grant_meta = service.get_list([GrantAgreement], {"limit": [100]})

        # Get combined results
        combined_results, combined_meta = service.get_list([ContractAgreement, GrantAgreement], {"limit": [100]})

        # Combined count should equal sum of individual counts
        expected_total = contract_meta["count"] + grant_meta["count"]
        assert combined_meta["count"] == expected_total

    @patch("ops_api.ops.utils.agreements_helpers.get_current_user")
    def test_pagination_with_ownership_filter(self, mock_get_user, loaded_db, app_ctx):
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
    def test_pagination_ownership_filter_affects_count(self, mock_get_user, loaded_db, app_ctx):
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


class TestAgreementsAtomicCreation:
    """Test suite for atomic agreement creation with nested entities"""

    def test_create_agreement_with_budget_line_items_without_services_component_ref(self, loaded_db, app_ctx):
        """Test that budget line items can be created without services_component_ref (backward compatibility)"""
        service = AgreementsService(loaded_db)

        # Create request with budget line items but no services_component_ref
        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement Without SC Ref",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "budget_line_items": [
                {
                    "line_description": "Year 1",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    # Note: no services_component_ref or services_component_id
                },
                {
                    "line_description": "Year 2",
                    "amount": 525000.00,
                    "can_id": 501,
                    "status": BudgetLineItemStatus.DRAFT,
                },
            ],
        }

        # Should not raise an error about services_component_ref
        agreement, results = service.create(create_request)

        assert agreement is not None
        assert results["budget_line_items_created"] == 2
        assert results["services_components_created"] == 0

    def test_create_agreement_with_blis_referencing_scs(self, loaded_db, app_ctx):
        """Test that budget line items can reference services components using services_component_ref"""
        service = AgreementsService(loaded_db)

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement with SC References",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [
                {
                    "ref": "base_period",
                    "number": 1,
                    "optional": False,
                    "description": "Base Period",
                },
                {
                    "ref": "option_1",
                    "number": 2,
                    "optional": True,
                    "description": "Option 1",
                },
            ],
            "budget_line_items": [
                {
                    "line_description": "Base Period Budget",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "base_period",
                },
                {
                    "line_description": "Option 1 Budget",
                    "amount": 525000.00,
                    "can_id": 501,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "option_1",
                },
            ],
        }

        agreement, results = service.create(create_request)

        assert agreement is not None
        assert results["budget_line_items_created"] == 2
        assert results["services_components_created"] == 2

        # Verify budget line items are linked to services components
        assert len(agreement.budget_line_items) == 2
        assert all(bli.services_component_id is not None for bli in agreement.budget_line_items)

    def test_create_agreement_with_invalid_services_component_ref(self, loaded_db, app_ctx):
        """Test that invalid services_component_ref raises ValidationError"""
        service = AgreementsService(loaded_db)

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement Invalid SC Ref",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [{"ref": "base_period", "number": 1, "optional": False}],
            "budget_line_items": [
                {
                    "line_description": "Budget",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "nonexistent_ref",  # Invalid reference
                }
            ],
        }

        with pytest.raises(ValidationError) as exc_info:
            service.create(create_request)

        assert "services_component_ref" in exc_info.value.validation_errors
        assert "nonexistent_ref" in str(exc_info.value.validation_errors["services_component_ref"][0])

    def test_create_agreement_with_default_numeric_sc_refs(self, loaded_db, app_ctx):
        """Test that services components without explicit ref use numeric index as default"""
        service = AgreementsService(loaded_db)

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement Numeric SC Refs",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [
                {"number": 1, "optional": False},  # No ref, should default to "0"
                {"number": 2, "optional": True},  # No ref, should default to "1"
            ],
            "budget_line_items": [
                {
                    "line_description": "Base Period",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "0",  # Reference by index
                },
                {
                    "line_description": "Option 1",
                    "amount": 525000.00,
                    "can_id": 501,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "1",  # Reference by index
                },
            ],
        }

        agreement, results = service.create(create_request)

        assert agreement is not None
        assert results["budget_line_items_created"] == 2
        assert results["services_components_created"] == 2


class TestAgreementsAtomicCreationRollback:
    """Test suite for transaction rollback behavior in atomic agreement creation"""

    def test_invalid_can_id_causes_complete_rollback(self, loaded_db, app_ctx):
        """Test that invalid CAN ID causes complete rollback - no agreement or BLIs created"""
        from ops_api.ops.services.ops_service import ResourceNotFoundError

        service = AgreementsService(loaded_db)

        # Count existing agreements before the test
        initial_agreement_count = loaded_db.query(ContractAgreement).count()
        initial_bli_count = loaded_db.query(BudgetLineItem).count()

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement - Should Rollback",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "budget_line_items": [
                {
                    "line_description": "Valid BLI",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                },
                {
                    "line_description": "Invalid BLI with bad CAN",
                    "amount": 525000.00,
                    "can_id": 99999,  # Non-existent CAN ID
                    "status": BudgetLineItemStatus.DRAFT,
                },
            ],
        }

        # Should raise ResourceNotFoundError
        with pytest.raises(ResourceNotFoundError) as exc_info:
            service.create(create_request)

        assert "CAN" in str(exc_info.value)
        assert "99999" in str(exc_info.value)

        # Verify complete rollback - no new agreements or BLIs created
        final_agreement_count = loaded_db.query(ContractAgreement).count()
        final_bli_count = loaded_db.query(BudgetLineItem).count()

        assert final_agreement_count == initial_agreement_count, "Agreement should not be created after rollback"
        assert final_bli_count == initial_bli_count, "No budget line items should be created after rollback"

    def test_invalid_services_component_ref_causes_complete_rollback(self, loaded_db, app_ctx):
        """Test that invalid services_component_ref causes complete rollback - no agreement, SCs, or BLIs created"""
        from models import ServicesComponent

        service = AgreementsService(loaded_db)

        # Count existing entities before the test
        initial_agreement_count = loaded_db.query(ContractAgreement).count()
        initial_sc_count = loaded_db.query(ServicesComponent).count()
        initial_bli_count = loaded_db.query(BudgetLineItem).count()

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement - Should Rollback",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [
                {
                    "ref": "base_period",
                    "number": 1,
                    "optional": False,
                    "description": "Base Period",
                },
            ],
            "budget_line_items": [
                {
                    "line_description": "BLI with invalid ref",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "nonexistent_ref",  # Invalid reference
                }
            ],
        }

        # Should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            service.create(create_request)

        assert "services_component_ref" in exc_info.value.validation_errors
        assert "nonexistent_ref" in str(exc_info.value.validation_errors["services_component_ref"][0])

        # Verify complete rollback - no new agreements, SCs, or BLIs created
        final_agreement_count = loaded_db.query(ContractAgreement).count()
        final_sc_count = loaded_db.query(ServicesComponent).count()
        final_bli_count = loaded_db.query(BudgetLineItem).count()

        assert final_agreement_count == initial_agreement_count, "Agreement should not be created after rollback"
        assert final_sc_count == initial_sc_count, "Services components should not be created after rollback"
        assert final_bli_count == initial_bli_count, "Budget line items should not be created after rollback"

    def test_no_orphaned_services_components_after_bli_failure(self, loaded_db, app_ctx):
        """Test that services components are not orphaned when BLI creation fails"""
        from models import ServicesComponent
        from ops_api.ops.services.ops_service import ResourceNotFoundError

        service = AgreementsService(loaded_db)

        # Count existing services components before the test
        initial_sc_count = loaded_db.query(ServicesComponent).count()

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement - SC Orphan Test",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [
                {
                    "ref": "base_period",
                    "number": 1,
                    "optional": False,
                    "description": "This should not persist",
                },
                {
                    "ref": "option_1",
                    "number": 2,
                    "optional": True,
                    "description": "This should not persist either",
                },
            ],
            "budget_line_items": [
                {
                    "line_description": "BLI with valid SC ref",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "base_period",
                },
                {
                    "line_description": "BLI with invalid CAN",
                    "amount": 525000.00,
                    "can_id": 99999,  # Non-existent CAN ID - will cause failure
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "option_1",
                },
            ],
        }

        # Should raise ResourceNotFoundError
        with pytest.raises(ResourceNotFoundError):
            service.create(create_request)

        # Verify no orphaned services components - count should be unchanged
        final_sc_count = loaded_db.query(ServicesComponent).count()
        assert final_sc_count == initial_sc_count, "No orphaned services components should exist after rollback"

    def test_database_state_unchanged_after_rollback(self, loaded_db, app_ctx):
        """Test that database state is completely unchanged after a failed transaction"""
        from models import ServicesComponent
        from ops_api.ops.services.ops_service import ResourceNotFoundError

        service = AgreementsService(loaded_db)

        # Capture complete database state before the test
        initial_agreement_count = loaded_db.query(Agreement).count()
        initial_contract_count = loaded_db.query(ContractAgreement).count()
        initial_bli_count = loaded_db.query(BudgetLineItem).count()
        initial_sc_count = loaded_db.query(ServicesComponent).count()

        # Get the latest agreement ID (to verify no new agreements created)
        latest_agreement = loaded_db.query(Agreement).order_by(Agreement.id.desc()).first()
        latest_agreement_id = latest_agreement.id if latest_agreement else 0

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement - State Verification",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [
                {"ref": "sc1", "number": 1, "optional": False},
                {"ref": "sc2", "number": 2, "optional": True},
            ],
            "budget_line_items": [
                {
                    "line_description": "Valid BLI 1",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "sc1",
                },
                {
                    "line_description": "Valid BLI 2",
                    "amount": 300000.00,
                    "can_id": 501,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "sc2",
                },
                {
                    "line_description": "Invalid BLI - bad CAN",
                    "amount": 200000.00,
                    "can_id": 88888,  # Non-existent CAN ID
                    "status": BudgetLineItemStatus.DRAFT,
                },
            ],
        }

        # Should raise ResourceNotFoundError
        with pytest.raises(ResourceNotFoundError):
            service.create(create_request)

        # Verify all counts are unchanged
        final_agreement_count = loaded_db.query(Agreement).count()
        final_contract_count = loaded_db.query(ContractAgreement).count()
        final_bli_count = loaded_db.query(BudgetLineItem).count()
        final_sc_count = loaded_db.query(ServicesComponent).count()

        assert final_agreement_count == initial_agreement_count
        assert final_contract_count == initial_contract_count
        assert final_bli_count == initial_bli_count
        assert final_sc_count == initial_sc_count

        # Verify no new agreement IDs were created
        latest_agreement_after = loaded_db.query(Agreement).order_by(Agreement.id.desc()).first()
        latest_agreement_id_after = latest_agreement_after.id if latest_agreement_after else 0
        assert latest_agreement_id_after == latest_agreement_id, "No new agreement IDs should be allocated"

    def test_bli_creation_failure_after_multiple_scs_created(self, loaded_db, app_ctx):
        """Test rollback when BLI fails after multiple SCs have been successfully created"""
        from models import ServicesComponent
        from ops_api.ops.services.ops_service import ResourceNotFoundError

        service = AgreementsService(loaded_db)

        # Count existing entities
        initial_agreement_count = loaded_db.query(ContractAgreement).count()
        initial_sc_count = loaded_db.query(ServicesComponent).count()
        initial_bli_count = loaded_db.query(BudgetLineItem).count()

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement - Multiple SC Rollback",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "services_components": [
                {"ref": "sc1", "number": 1, "optional": False, "description": "SC 1"},
                {"ref": "sc2", "number": 2, "optional": True, "description": "SC 2"},
                {"ref": "sc3", "number": 3, "optional": True, "description": "SC 3"},
                {"ref": "sc4", "number": 4, "optional": True, "description": "SC 4"},
            ],
            "budget_line_items": [
                {
                    "line_description": "Valid BLI 1",
                    "amount": 100000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "sc1",
                },
                {
                    "line_description": "Valid BLI 2",
                    "amount": 200000.00,
                    "can_id": 501,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "sc2",
                },
                {
                    "line_description": "Valid BLI 3",
                    "amount": 150000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "sc3",
                },
                {
                    "line_description": "Invalid BLI - will cause rollback",
                    "amount": 250000.00,
                    "can_id": 77777,  # Non-existent CAN
                    "status": BudgetLineItemStatus.DRAFT,
                    "services_component_ref": "sc4",
                },
            ],
        }

        # Should raise ResourceNotFoundError
        with pytest.raises(ResourceNotFoundError):
            service.create(create_request)

        # Verify all 4 services components were rolled back
        final_agreement_count = loaded_db.query(ContractAgreement).count()
        final_sc_count = loaded_db.query(ServicesComponent).count()
        final_bli_count = loaded_db.query(BudgetLineItem).count()

        assert final_agreement_count == initial_agreement_count, "Agreement should be rolled back"
        assert final_sc_count == initial_sc_count, "All 4 services components should be rolled back"
        assert final_bli_count == initial_bli_count, "All budget line items should be rolled back"

    def test_first_bli_failure_prevents_subsequent_bli_creation(self, loaded_db, app_ctx):
        """Test that if first BLI fails, subsequent BLIs are not created"""
        from ops_api.ops.services.ops_service import ResourceNotFoundError

        service = AgreementsService(loaded_db)

        initial_bli_count = loaded_db.query(BudgetLineItem).count()

        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement - First BLI Fails",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "budget_line_items": [
                {
                    "line_description": "First BLI - Invalid CAN",
                    "amount": 100000.00,
                    "can_id": 66666,  # Non-existent CAN - fails immediately
                    "status": BudgetLineItemStatus.DRAFT,
                },
                {
                    "line_description": "Second BLI - Should not be processed",
                    "amount": 200000.00,
                    "can_id": 500,
                    "status": BudgetLineItemStatus.DRAFT,
                },
                {
                    "line_description": "Third BLI - Should not be processed",
                    "amount": 300000.00,
                    "can_id": 501,
                    "status": BudgetLineItemStatus.DRAFT,
                },
            ],
        }

        # Should raise ResourceNotFoundError on first BLI
        with pytest.raises(ResourceNotFoundError):
            service.create(create_request)

        # Verify no BLIs were created (not even the valid ones)
        final_bli_count = loaded_db.query(BudgetLineItem).count()
        assert final_bli_count == initial_bli_count, "No BLIs should be created when first one fails"


class TestAgreementsDuplicateNameHandling:
    """Test suite for duplicate agreement name validation"""

    def test_create_agreement_with_duplicate_name_raises_validation_error(self, loaded_db, app_ctx):
        """Test that creating an agreement with a duplicate name (same type) raises ValidationError"""
        service = AgreementsService(loaded_db)

        # Create the first agreement
        create_request_1 = {
            "agreement_cls": ContractAgreement,
            "name": "Unique Test Agreement Name",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        agreement_1, _ = service.create(create_request_1)
        assert agreement_1 is not None

        # Try to create another agreement with the same name and type
        create_request_2 = {
            "agreement_cls": ContractAgreement,
            "name": "Unique Test Agreement Name",  # Same name (case-insensitive)
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        # Should raise ValidationError with specific message about duplicate name
        with pytest.raises(ValidationError) as exc_info:
            service.create(create_request_2)

        assert "name" in exc_info.value.validation_errors
        assert "already exists" in str(exc_info.value.validation_errors["name"][0])
        assert "unique" in str(exc_info.value.validation_errors["name"][0]).lower()

    def test_create_agreement_with_duplicate_name_case_insensitive(self, loaded_db, app_ctx):
        """Test that duplicate name check is case-insensitive"""
        service = AgreementsService(loaded_db)

        # Create the first agreement
        create_request_1 = {
            "agreement_cls": ContractAgreement,
            "name": "Test Agreement Case Sensitivity",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        agreement_1, _ = service.create(create_request_1)
        assert agreement_1 is not None

        # Try to create another agreement with same name but different case
        create_request_2 = {
            "agreement_cls": ContractAgreement,
            "name": "TEST AGREEMENT CASE SENSITIVITY",  # Same name, different case
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        # Should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            service.create(create_request_2)

        assert "name" in exc_info.value.validation_errors

    def test_create_agreement_with_same_name_different_type_succeeds(self, loaded_db, app_ctx):
        """Test that agreements with same name but different types can coexist"""
        service = AgreementsService(loaded_db)

        # Create a contract agreement
        create_request_contract = {
            "agreement_cls": ContractAgreement,
            "name": "Cross Type Agreement Name",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        agreement_contract, _ = service.create(create_request_contract)
        assert agreement_contract is not None

        # Create a grant agreement with the same name (should succeed)
        create_request_grant = {
            "agreement_cls": GrantAgreement,
            "name": "Cross Type Agreement Name",  # Same name, different type
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        agreement_grant, _ = service.create(create_request_grant)
        assert agreement_grant is not None
        assert agreement_grant.name == agreement_contract.name
        assert agreement_grant.agreement_type != agreement_contract.agreement_type

    @patch("ops_api.ops.services.agreements.get_current_user")
    @patch("ops_api.ops.validation.rules.agreement.check_user_association")
    def test_update_agreement_with_duplicate_name_raises_validation_error(self, mock_check_association, mock_get_user_services, loaded_db, app_ctx):
        """Test that updating an agreement to a duplicate name (same type) raises ValidationError"""
        # Mock authorization check to always pass
        mock_check_association.return_value = True
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user_services.return_value = mock_user

        service = AgreementsService(loaded_db)

        # Create two agreements with different names
        create_request_1 = {
            "agreement_cls": ContractAgreement,
            "name": "First Agreement for Update Test",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        create_request_2 = {
            "agreement_cls": ContractAgreement,
            "name": "Second Agreement for Update Test",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        agreement_1, _ = service.create(create_request_1)
        agreement_2, _ = service.create(create_request_2)

        assert agreement_1 is not None
        assert agreement_2 is not None

        # Try to update agreement_2 to have the same name as agreement_1
        update_request = {
            "agreement_cls": ContractAgreement,
            "name": "First Agreement for Update Test",  # Duplicate name
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        # Should raise ValidationError with specific message about duplicate name
        with pytest.raises(ValidationError) as exc_info:
            service.update(agreement_2.id, update_request)

        assert "name" in exc_info.value.validation_errors
        assert "already exists" in str(exc_info.value.validation_errors["name"][0])
        assert "unique" in str(exc_info.value.validation_errors["name"][0]).lower()

    @patch("ops_api.ops.services.agreements.get_current_user")
    @patch("ops_api.ops.validation.rules.agreement.check_user_association")
    def test_update_agreement_with_duplicate_name_case_insensitive(self, mock_check_association, mock_get_user_services, loaded_db, app_ctx):
        """Test that duplicate name check on update is case-insensitive"""
        # Mock authorization check to always pass
        mock_check_association.return_value = True
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user_services.return_value = mock_user

        service = AgreementsService(loaded_db)

        # Create two agreements with different names
        create_request_1 = {
            "agreement_cls": ContractAgreement,
            "name": "Original Agreement Name",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        create_request_2 = {
            "agreement_cls": ContractAgreement,
            "name": "Different Agreement Name",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        agreement_1, _ = service.create(create_request_1)
        agreement_2, _ = service.create(create_request_2)

        # Try to update agreement_2 with same name as agreement_1 but different case
        update_request = {
            "agreement_cls": ContractAgreement,
            "name": "ORIGINAL AGREEMENT NAME",  # Same name, different case
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
        }

        # Should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            service.update(agreement_2.id, update_request)

        assert "name" in exc_info.value.validation_errors

    @patch("ops_api.ops.services.agreements.get_current_user")
    @patch("ops_api.ops.validation.rules.agreement.check_user_association")
    def test_update_agreement_keeps_same_name_succeeds(self, mock_check_association, mock_get_user_services, loaded_db, app_ctx):
        """Test that updating an agreement while keeping its own name succeeds"""
        # Mock authorization check to always pass
        mock_check_association.return_value = True
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user_services.return_value = mock_user

        service = AgreementsService(loaded_db)

        # Create an agreement
        create_request = {
            "agreement_cls": ContractAgreement,
            "name": "Agreement to Update",
            "agreement_reason": AgreementReason.NEW_REQ,
            "project_id": 1000,
            "description": "Original description",
        }

        agreement, _ = service.create(create_request)
        assert agreement is not None

        # Update the agreement but keep the same name (should succeed)
        update_request = {
            "agreement_cls": ContractAgreement,
            "name": "Agreement to Update",  # Same name
            "agreement_reason": AgreementReason.RECOMPETE,  # Different reason
            "project_id": 1000,
            "description": "Updated description",  # Different description
        }

        updated_agreement, status_code = service.update(agreement.id, update_request)

        assert updated_agreement is not None
        assert status_code == 200
        assert updated_agreement.name == "Agreement to Update"
        assert updated_agreement.agreement_reason == AgreementReason.RECOMPETE
        assert updated_agreement.description == "Updated description"
