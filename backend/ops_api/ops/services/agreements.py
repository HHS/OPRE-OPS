from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, List, Optional, Sequence, Type

from flask import current_app
from flask_jwt_extended import get_current_user
from loguru import logger
from sqlalchemy import Select, distinct, func, or_, select, union
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models import (
    CAN,
    AaAgreement,
    Agreement,
    AgreementSortCondition,
    AgreementTeamMembers,
    BudgetLineItem,
    BudgetLineItemStatus,
    ChangeRequestType,
    ContractAgreement,
    Division,
    GrantAgreement,
    OpsEventType,
    Portfolio,
    PortfolioTeamLeaders,
    Project,
    ResearchMethodology,
    ServicesComponent,
    SpecialTopic,
    User,
    Vendor,
)
from models.agreements import AgreementType
from models.procurement_tracker import ProcurementTrackerStatus
from models.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.schemas.agreements import AgreementListFilterOptionResponseSchema
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    OpsService,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
from ops_api.ops.utils.budget_line_items_helpers import create_budget_line_item_instance
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.validation.agreement_validator import AgreementValidator
from ops_api.ops.validation.awarded_agreement_validator import AwardedAgreementValidator


@dataclass
class AgreementFilters:
    """Data class to encapsulate all filter parameters for Agreements."""

    fiscal_year: Optional[list[int]] = None
    budget_line_status: Optional[list[str]] = None
    portfolio: Optional[list[int]] = None
    project_id: Optional[list[int]] = None
    agreement_reason: Optional[list[str]] = None
    contract_number: Optional[list[str]] = None
    contract_type: Optional[list[str]] = None
    agreement_type: Optional[list[str]] = None
    delivered_status: Optional[list[str]] = None
    awarding_entity_id: Optional[list[int]] = None
    project_officer_id: Optional[list[int]] = None
    alternate_project_officer_id: Optional[list[int]] = None
    foa: Optional[list[str]] = None
    name: Optional[list[str]] = None
    search: Optional[list[str]] = None
    only_my: Optional[list[bool]] = None
    award_type: Optional[list[str]] = None
    exact_match: Optional[bool] = None
    limit: Optional[list[int]] = None
    offset: Optional[list[int]] = None
    sort_conditions: Optional[list[AgreementSortCondition]] = None
    sort_descending: Optional[list[bool]] = None

    @classmethod
    def parse_filters(cls, data: dict) -> "AgreementFilters":
        """Parse filter parameters from request data."""

        return cls(
            fiscal_year=data.get("fiscal_year", []),
            budget_line_status=data.get("budget_line_status", []),
            portfolio=data.get("portfolio", []),
            project_id=data.get("project_id", []),
            agreement_reason=data.get("agreement_reason", []),
            contract_number=data.get("contract_number", []),
            contract_type=data.get("contract_type", []),
            agreement_type=data.get("agreement_type", []),
            delivered_status=data.get("delivered_status", []),
            awarding_entity_id=data.get("awarding_entity_id", []),
            project_officer_id=data.get("project_officer_id", []),
            alternate_project_officer_id=data.get("alternate_project_officer_id", []),
            foa=data.get("foa", []),
            name=data.get("name", []),
            search=data.get("search", []),
            only_my=data.get("only_my", []),
            award_type=[at.name if hasattr(at, "name") else at for at in data.get("award_type", [])],
            exact_match=data.get("exact_match", [True])[0],
            limit=data.get("limit", [10]),
            offset=data.get("offset", [0]),
            sort_conditions=data.get("sort_conditions", []),
            sort_descending=data.get("sort_descending", []),
        )


class AgreementsService(OpsService[Agreement]):
    def __init__(self, db_session):
        self.db_session = db_session

    def create(self, create_request: dict[str, Any]) -> tuple[Agreement, dict[str, Any]]:
        """
        Create a new agreement with optional nested budget line items and services components.

        This method supports atomic creation of an agreement along with its related entities:
        - Budget line items can be created and associated with the agreement
        - Services components can be created and associated with the agreement
        - Budget line items can reference newly created services components via 'services_component_ref'

        The creation process follows these steps:
        1. Create the agreement (flush to get ID)
        2. Create services components first (so BLIs can reference them)
        3. Create budget line items, resolving any services_component_ref to actual IDs
        4. Commit the entire transaction

        All operations are atomic - if any step fails, the entire transaction is rolled back.

        Args:
            create_request: Dictionary containing agreement data and optional nested entities:
                - agreement_cls: The agreement class to instantiate
                - budget_line_items: Optional list of budget line item data dicts
                - services_components: Optional list of services component data dicts
                - ...other agreement fields

        Returns:
            Tuple containing:
                - agreement: The created Agreement instance
                - metadata: Dictionary with budget_line_items_created and services_components_created counts

        Raises:
            ValidationError: If validation fails (e.g., invalid services_component_ref)
            ResourceNotFoundError: If referenced entities don'tracker exist (e.g., invalid can_id)
        """
        # STEP 0: Extract nested entity data from request
        budget_line_items_data = create_request.pop("budget_line_items", [])
        services_components_data = create_request.pop("services_components", [])

        try:
            # STEP 1: Create agreement (existing logic)
            agreement_cls = create_request.get("agreement_cls")
            del create_request["agreement_cls"]

            _set_team_members(self.db_session, create_request)
            _validate_research_methodologies_and_special_topics(
                self.db_session,
                create_request.get("research_methodologies", []),
                create_request.get("special_topics", []),
            )
            _set_research_methodologies_and_special_topics(self.db_session, create_request)
            agreement = agreement_cls(**create_request)

            add_update_vendor(self.db_session, create_request.get("vendor"), agreement, "vendor")

            self.db_session.add(agreement)
            self.db_session.flush()  # Flush to get agreement.id WITHOUT committing transaction

            # STEP 2: Create services components FIRST (so BLIs can reference them)
            sc_ref_map, sc_count = self._create_services_components(agreement.id, services_components_data)

            # STEP 3: Create budget line items, resolving services_component_ref
            bli_count = self._create_budget_line_items(agreement, budget_line_items_data, sc_ref_map)

            # STEP 4: Commit the entire transaction
            self.db_session.commit()

            logger.info(
                f"Successfully created Agreement id={agreement.id} with {bli_count} budget line items "
                f"and {sc_count} services components"
            )

            # STEP 5: Return enriched response
            return agreement, {
                "budget_line_items_created": bli_count,
                "services_components_created": sc_count,
            }

        except IntegrityError as e:
            # Rollback the transaction on integrity error (e.g., unique constraint violation)
            self.db_session.rollback()
            logger.error(f"Failed to create agreement - integrity constraint violated: {e}")

            # Check if it's the unique name constraint
            if "ix_agreement_name_type_lower" in str(e):
                raise ValidationError(
                    {
                        "name": [
                            "An agreement with this name and type already exists. "
                            "Agreement names must be unique (case-insensitive) within each agreement type."
                        ]
                    }
                )
            # For other integrity errors, re-raise
            raise
        except Exception as e:
            # Rollback the transaction on any error
            self.db_session.rollback()
            logger.error(f"Failed to create agreement atomically: {e}")
            # Re-raise the exception to be handled by the caller
            raise

    def _create_services_components(
        self, agreement_id: int, services_components_data: list[dict[str, Any]]
    ) -> tuple[dict[str, int], int]:
        """
        Create services components for an agreement.

        Args:
            agreement_id: The agreement ID to associate with services components
            services_components_data: List of services component data dictionaries

        Returns:
            Tuple of (sc_ref_map, sc_count) where:
                - sc_ref_map: Map of temporary reference to actual ServicesComponent ID
                - sc_count: Number of services components created
        """
        sc_ref_map = {}  # Map temporary ref -> actual ServicesComponent ID
        sc_count = 0

        for idx, sc_data in enumerate(services_components_data):
            # Extract temporary reference (default to string index if not provided)
            temp_ref = sc_data.pop("ref", None) or str(idx)

            # Set agreement_id on the services component
            sc_data["agreement_id"] = agreement_id

            # Create services component directly (skip authorization - user already authorized for agreement)
            new_sc = ServicesComponent(**sc_data)
            self.db_session.add(new_sc)
            self.db_session.flush()  # Flush to get new_sc.id

            # Store mapping of temporary reference to actual ID
            sc_ref_map[temp_ref] = new_sc.id
            sc_count += 1

            logger.debug(
                f"Created ServicesComponent with ref={temp_ref!r} -> id={new_sc.id!r} for agreement_id={agreement_id!r}"
            )

        return sc_ref_map, sc_count

    def _create_budget_line_items(
        self,
        agreement: Agreement,
        budget_line_items_data: list[dict[str, Any]],
        sc_ref_map: dict[str, int],
    ) -> int:
        """
        Create budget line items for an agreement.

        Args:
            agreement: The agreement to associate with budget line items
            budget_line_items_data: List of budget line item data dictionaries
            sc_ref_map: Map of services component references to IDs for resolution

        Returns:
            Number of budget line items created

        Raises:
            ValidationError: If services_component_ref is invalid
            ResourceNotFoundError: If referenced CAN doesn'tracker exist
        """
        bli_count = 0

        for bli_data in budget_line_items_data:
            # Resolve services_component_ref to services_component_id (if provided and not None)
            services_component_ref = bli_data.pop("services_component_ref", None)
            if services_component_ref is not None:
                if services_component_ref not in sc_ref_map:
                    raise ValidationError(
                        {
                            "services_component_ref": [
                                f"Invalid services_component_ref {services_component_ref!r}. "
                                f"No services component with that reference exists in the request. "
                                f"Available references: {list(sc_ref_map.keys())}"
                            ]
                        }
                    )
                bli_data["services_component_id"] = sc_ref_map[services_component_ref]
                logger.debug(
                    f"Resolved services_component_ref {services_component_ref!r} "
                    f"to services_component_id={sc_ref_map[services_component_ref]!r}"
                )

            # Set agreement_id on the budget line item
            bli_data["agreement_id"] = agreement.id

            # Validate CAN exists if provided
            if bli_data.get("can_id"):
                can = self.db_session.get(CAN, bli_data["can_id"])
                if not can:
                    raise ResourceNotFoundError("CAN", bli_data["can_id"])

            # Create budget line item using helper (handles polymorphism based on agreement type)
            new_bli = create_budget_line_item_instance(agreement.agreement_type, bli_data)

            self.db_session.add(new_bli)
            bli_count += 1

            logger.debug(
                f"Created BudgetLineItem id={new_bli.id if new_bli.id else '(pending)'} for agreement_id={agreement.id}"
            )

        return bli_count

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[Agreement, int]:
        """
        Update an existing agreement
        """
        agreement = self.db_session.get(Agreement, id)

        # Use appropriate validator based on whether agreement is awarded
        user = get_current_user()
        if agreement and agreement.is_awarded:
            validator = AwardedAgreementValidator()
        else:
            validator = AgreementValidator()

        validator.validate(agreement, user, updated_fields, self.db_session)

        agreement_cls = updated_fields.get("agreement_cls")
        del updated_fields["agreement_cls"]

        # unpack the awarding_entity_id if it exists since we handle it separately (after the merge)
        awarding_entity_id = None
        if "awarding_entity_id" in updated_fields:
            awarding_entity_id = updated_fields.get("awarding_entity_id")
            del updated_fields["awarding_entity_id"]

        updated_fields["id"] = id

        try:
            _set_team_members(self.db_session, updated_fields)
            _set_research_methodologies_and_special_topics(self.db_session, updated_fields)

            agreement_data = agreement_cls(**updated_fields)

            add_update_vendor(self.db_session, updated_fields.get("vendor"), agreement_data, "vendor")

            self.db_session.merge(agreement_data)
            self.db_session.commit()

            change_request_id = None
            if awarding_entity_id:
                change_request_id = self._handle_proc_shop_change(agreement, awarding_entity_id)

            self.db_session.commit()

            return agreement, 202 if change_request_id else 200

        except IntegrityError as e:
            # Rollback the transaction on integrity error (e.g., unique constraint violation)
            self.db_session.rollback()
            logger.error(f"Failed to update agreement id={id} - integrity constraint violated: {e}")

            # Check if it's the unique name constraint
            if "ix_agreement_name_type_lower" in str(e):
                raise ValidationError(
                    {
                        "name": [
                            "An agreement with this name and type already exists. "
                            "Agreement names must be unique (case-insensitive) within each agreement type."
                        ]
                    }
                )
            # For other integrity errors, re-raise
            raise
        except Exception as e:
            # Rollback the transaction on any error
            self.db_session.rollback()
            logger.error(f"Failed to update agreement id={id}: {e}")
            # Re-raise the exception to be handled by the caller
            raise

    def delete(self, id: int) -> None:
        """
        Delete an agreement
        """
        agreement = self.db_session.get(Agreement, id)

        if not agreement:
            raise ResourceNotFoundError("Agreement", id)

        if not associated_with_agreement(id):
            raise AuthorizationError(
                f"User is not associated with the agreement for id: {id}.",
                "Agreement",
            )

        if agreement.is_awarded:
            raise ValidationError({"is_awarded": ["Cannot delete an awarded agreement."]})

        self.db_session.delete(agreement)
        self.db_session.commit()

    def get(self, id: int) -> Agreement:
        """
        Get an agreement by ID
        """
        agreement = self.db_session.get(Agreement, id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", id)
        return agreement

    def get_list(
        self, agreement_classes: list[Type[Agreement]], data: dict[str, Any]
    ) -> tuple[list[Agreement], dict[str, Any]]:
        """
        Get list of agreements with optional filtering and pagination.

        Args:
            agreement_classes: List of Agreement subclasses to query (e.g., ContractAgreement, GrantAgreement)
            data: Dictionary containing filter parameters including limit and offset

        Returns:
            Tuple of (paginated agreements list, metadata dict with count/limit/offset)
        """
        # Import helper functions from resources
        filters = AgreementFilters.parse_filters(data)

        # Collect all agreements across types using existing resource helpers
        all_results = []
        for agreement_cls in agreement_classes:
            agreements = _get_agreements(self.db_session, agreement_cls, data)
            all_results.extend(agreements)

        # Filter by award_type (computed property, must be done post-query)
        if filters.award_type:
            all_results = [a for a in all_results if a.award_type in filters.award_type]

        # Sort combined results
        if filters.sort_conditions and len(filters.sort_conditions) > 0:
            sort_condition = filters.sort_conditions[0]
            sort_descending = (
                filters.sort_descending[0] if filters.sort_descending and len(filters.sort_descending) > 0 else False
            )
            all_results = _sort_agreements(all_results, sort_condition, sort_descending, filters.fiscal_year)

        # Calculate count before slicing
        total_count = len(all_results)

        # Calculate aggregate totals before pagination (for summary cards)
        totals = _compute_agreement_totals(all_results)

        # Calculate procurement overview and step summary before pagination
        overview_fiscal_year = filters.fiscal_year[0] if filters.fiscal_year and len(filters.fiscal_year) == 1 else None
        procurement_overview = _compute_procurement_overview(all_results, overview_fiscal_year)
        procurement_step_summary = _compute_procurement_step_summary(all_results, overview_fiscal_year)
        procurement_days_in_step = _compute_days_in_procurement_step(all_results, overview_fiscal_year)

        # Apply pagination slicing
        if filters.limit is not None and filters.offset is not None:
            limit_value = filters.limit[0]
            offset_value = filters.offset[0]
            paginated_results = all_results[offset_value : offset_value + limit_value]
        else:
            paginated_results = all_results
            limit_value = total_count
            offset_value = 0

        metadata = {
            "count": total_count,
            "limit": limit_value,
            "offset": offset_value,
            "totals": totals,
            "procurement_overview": procurement_overview,
            "procurement_step_summary": procurement_step_summary,
            "procurement_days_in_step": procurement_days_in_step,
        }

        return paginated_results, metadata

    def _handle_proc_shop_change(self, agreement: Agreement, new_value: int) -> int | None:
        if agreement.awarding_entity_id == new_value:
            return None  # No change needed

        # Get the current status list for ordering
        bli_statuses = list(BudgetLineItemStatus.__members__.values())

        # Block if any BLIs are IN_EXECUTION or higher
        if any(
            [
                bli_statuses.index(bli.status) >= bli_statuses.index(BudgetLineItemStatus.IN_EXECUTION)
                for bli in agreement.budget_line_items
            ]
        ):
            raise ValidationError(
                "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."
            )

        # Apply the change immediate if all BLIs are DRAFT
        if all(
            bli_statuses.index(bli.status) == bli_statuses.index(BudgetLineItemStatus.DRAFT)
            for bli in agreement.budget_line_items
        ):
            agreement.awarding_entity_id = new_value
            # TODO: update budget line items' procurement shop fees directly for DRAFT BLIs
            # self._update_draft_blis_proc_shop_fees(agreement)
            return None

        # Create a change request if at least one BLI is in PLANNED status
        if any(bli.status == BudgetLineItemStatus.PLANNED for bli in agreement.budget_line_items):
            change_request_service = ChangeRequestService(current_app.db_session)
            with OpsEventHandler(OpsEventType.CREATE_CHANGE_REQUEST) as cr_meta:
                change_request = change_request_service.create(
                    {
                        "agreement_id": agreement.id,
                        "requested_change_data": {"awarding_entity_id": new_value},
                        "requested_change_diff": {
                            "awarding_entity_id": {
                                "new": new_value,
                                "old": agreement.awarding_entity_id,
                            }
                        },
                        "created_by": get_current_user().id,
                        "change_request_type": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
                    }
                )
                cr_meta.metadata.update(
                    {
                        "agreement_id": agreement.id,
                        "change_request": change_request.to_dict(),
                    }
                )
            return change_request.id

        return None

    def _update_draft_blis_proc_shop_fees(self, agreement: Agreement):
        current_fee = (
            agreement.procurement_shop.current_fee
            if agreement.procurement_shop and agreement.procurement_shop.procurement_shop_fees
            else None
        )
        for bli in agreement.budget_line_items:
            bli.procurement_shop_fee = current_fee

    def get_filter_options(self, data: dict | None) -> dict[str, Any]:
        """
        Get filter options for the Agreement list using optimized database queries.

        PERFORMANCE: Uses database-level aggregation with DISTINCT queries instead of
        loading all agreements into memory. This approach is efficient even with
        thousands of agreements and budget line items.

        Respects the only_my parameter to filter by user association.
        """
        only_my = data.get("only_my", [])

        logger.debug("Beginning agreements filter queries")

        # Step 1: Build base agreement IDs subquery with optional user filtering
        base_agreement_query = select(Agreement.id)

        if only_my and True in only_my:
            user = get_current_user()
            # Filter by user association - reuse existing service method
            base_agreement_query = self._apply_user_association_filter(base_agreement_query, user)

        agreement_ids_subquery = base_agreement_query.subquery()

        # Step 2: Fiscal years - Query BLI fiscal_year with JOIN to agreements
        fiscal_years_query = (
            select(distinct(BudgetLineItem.fiscal_year))
            .join(Agreement, BudgetLineItem.agreement_id == Agreement.id)
            .where(Agreement.id.in_(agreement_ids_subquery))
            .where(BudgetLineItem.fiscal_year.isnot(None))
        )
        fiscal_years = sorted([fy for fy in self.db_session.scalars(fiscal_years_query).all()], reverse=True)

        # Step 3: Portfolios - JOIN through BLI → CAN → Portfolio
        portfolios_query = (
            select(distinct(Portfolio.id), Portfolio.name)
            .join(CAN, Portfolio.id == CAN.portfolio_id)
            .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
            .join(Agreement, BudgetLineItem.agreement_id == Agreement.id)
            .where(Agreement.id.in_(agreement_ids_subquery))
        )
        portfolios = [{"id": p_id, "name": p_name} for p_id, p_name in self.db_session.execute(portfolios_query).all()]
        portfolios = sorted(portfolios, key=lambda x: x["name"])

        # Step 4: Project titles - Direct JOIN to Project table
        projects_query = (
            select(distinct(Project.id), Project.title)
            .join(Agreement, Project.id == Agreement.project_id)
            .where(Agreement.id.in_(agreement_ids_subquery))
            .where(Project.title.isnot(None))
        )
        project_titles = [
            {"id": p_id, "name": p_title} for p_id, p_title in self.db_session.execute(projects_query).all()
        ]
        project_titles = sorted(project_titles, key=lambda x: x["name"])

        # Step 5: Agreement types - Direct query on agreement_type column
        agreement_types_query = (
            select(distinct(Agreement.agreement_type))
            .where(Agreement.id.in_(agreement_ids_subquery))
            .where(Agreement.agreement_type.isnot(None))
        )
        agreement_types = sorted([at.name for at in self.db_session.scalars(agreement_types_query).all()])

        # Step 6: Agreement names - Query id and name from agreements
        agreement_names_query = (
            select(Agreement.id, Agreement.name)
            .where(Agreement.id.in_(agreement_ids_subquery))
            .where(Agreement.name.isnot(None))
        )
        agreement_names = [
            {"id": a_id, "name": a_name} for a_id, a_name in self.db_session.execute(agreement_names_query).all()
        ]
        agreement_names = sorted(agreement_names, key=lambda x: x["name"])

        # Step 7: Contract numbers - UNION query on contract_agreement and aa_agreement
        # These are stored in subclass tables, not the base agreement table
        contract_numbers_query = union(
            select(distinct(ContractAgreement.contract_number))
            .where(ContractAgreement.id.in_(agreement_ids_subquery))
            .where(ContractAgreement.contract_number.isnot(None)),
            select(distinct(AaAgreement.contract_number))
            .where(AaAgreement.id.in_(agreement_ids_subquery))
            .where(AaAgreement.contract_number.isnot(None)),
        )
        contract_numbers = sorted([cn for cn in self.db_session.scalars(contract_numbers_query).all()])

        # Step 8: Research methodologies - Return empty for now (business logic not defined)
        # TODO: Implement research_types filter once business requirements are clarified
        research_types = []

        # Build response
        filters = {
            "fiscal_years": fiscal_years,
            "portfolios": portfolios,
            "project_titles": project_titles,
            "agreement_types": agreement_types,
            "agreement_names": agreement_names,
            "contract_numbers": contract_numbers,
            "research_types": research_types,
        }

        filter_response_schema = AgreementListFilterOptionResponseSchema()
        return filter_response_schema.dump(filters)

    def _apply_user_association_filter(self, query, user):
        """
        Apply user association filter to agreement query.

        Matches ALL association logic from check_user_association() in agreements_helpers.py.
        Checks if user is associated through:
        - Agreement creator
        - Project officer or alternate project officer
        - Agreement team member
        - Portfolio team leader
        - Division director or deputy division director
        - User has BUDGET_TEAM or SYSTEM_OWNER role
        - User is a super user
        """
        from ops_api.ops.utils.users import is_super_user  # late import to avoid circular dependency

        # Check for privileged roles first - these users see ALL agreements
        user_role_names = [role.name for role in user.roles]
        if "BUDGET_TEAM" in user_role_names or "SYSTEM_OWNER" in user_role_names or is_super_user(user, current_app):
            # User has access to all agreements, no filtering needed
            return query

        # Build conditions for user association (any one of these grants access)
        conditions = []

        # 1. User created the agreement
        conditions.append(Agreement.created_by == user.id)

        # 2. User is project officer
        conditions.append(Agreement.project_officer_id == user.id)

        # 3. User is alternate project officer
        conditions.append(Agreement.alternate_project_officer_id == user.id)

        # 4. User is a direct team member
        team_member_subquery = select(AgreementTeamMembers.agreement_id).where(AgreementTeamMembers.user_id == user.id)
        conditions.append(Agreement.id.in_(team_member_subquery))

        # 5. User is a portfolio team leader
        portfolio_leader_subquery = (
            select(Agreement.id)
            .join(BudgetLineItem, Agreement.id == BudgetLineItem.agreement_id)
            .join(CAN, BudgetLineItem.can_id == CAN.id)
            .join(Portfolio, CAN.portfolio_id == Portfolio.id)
            .join(PortfolioTeamLeaders, Portfolio.id == PortfolioTeamLeaders.portfolio_id)
            .where(PortfolioTeamLeaders.team_lead_id == user.id)
        )
        conditions.append(Agreement.id.in_(portfolio_leader_subquery))

        # 6. User is a division director
        division_director_subquery = (
            select(Agreement.id)
            .join(BudgetLineItem, Agreement.id == BudgetLineItem.agreement_id)
            .join(CAN, BudgetLineItem.can_id == CAN.id)
            .join(Portfolio, CAN.portfolio_id == Portfolio.id)
            .join(Division, Portfolio.division_id == Division.id)
            .where(Division.division_director_id == user.id)
        )
        conditions.append(Agreement.id.in_(division_director_subquery))

        # 7. User is a deputy division director
        deputy_division_director_subquery = (
            select(Agreement.id)
            .join(BudgetLineItem, Agreement.id == BudgetLineItem.agreement_id)
            .join(CAN, BudgetLineItem.can_id == CAN.id)
            .join(Portfolio, CAN.portfolio_id == Portfolio.id)
            .join(Division, Portfolio.division_id == Division.id)
            .where(Division.deputy_division_director_id == user.id)
        )
        conditions.append(Agreement.id.in_(deputy_division_director_subquery))

        # Apply all conditions with OR (user needs to match ANY condition)
        query = query.where(or_(*conditions))

        return query

    def _is_editable(self, agreement: Agreement, user: User) -> bool:
        """
        Determine if an agreement is editable for a particular user.

        An agreement is editable if the user is associated with the agreement.

        N.B. Currently the agreement is always editable if the user is a super user -
        this is also checked in associated_with_agreement, but we want to be explicit here since this is a key part of the logic.
        """
        return user.is_superuser or associated_with_agreement(agreement.id)


def add_update_vendor(session: Session, vendor: str, agreement: Agreement, field_name: str = "vendor") -> None:
    if vendor:
        vendor_obj = session.scalar(select(Vendor).where(Vendor.name.ilike(vendor)))
        if not vendor_obj:
            new_vendor = Vendor(name=vendor)
            session.add(new_vendor)
            session.commit()
            setattr(agreement, f"{field_name}", new_vendor)
        else:
            setattr(agreement, f"{field_name}", vendor_obj)


def get_team_members_from_request(session: Session, team_members_list: list[dict[str, Any]]) -> list[User]:
    """
    Translate the team_members_list from the request (Marshmallow schema) into a list of User objects.
    """
    if not team_members_list:
        return []
    return [session.get(User, tm_id.get("id")) for tm_id in team_members_list]


def _set_team_members(session: Session, updated_fields: dict[str, Any]) -> None:
    """
    Set team members and support contacts from the request data.
    """
    # TODO: would be nice for marshmallow to handle this instead at load time
    if "team_members" in updated_fields:
        updated_fields["team_members"] = get_team_members_from_request(session, updated_fields.get("team_members", []))
    if "support_contacts" in updated_fields:
        updated_fields["support_contacts"] = get_team_members_from_request(
            session, updated_fields.get("support_contacts", [])
        )


def _set_research_methodologies_and_special_topics(session: Session, updated_fields: dict[str, Any]) -> None:
    """
    Set research methodologies and special topics from the request data.
    """
    if "research_methodologies" in updated_fields:
        rm_list = []
        for rm_data in updated_fields.get("research_methodologies", []):
            rm = session.get(ResearchMethodology, rm_data.get("id"))
            if rm:
                rm_list.append(rm)
        updated_fields["research_methodologies"] = rm_list

    if "special_topics" in updated_fields:
        st_list = []
        for st_data in updated_fields.get("special_topics", []):
            st = session.get(SpecialTopic, st_data.get("id"))
            if st:
                st_list.append(st)
        updated_fields["special_topics"] = st_list


def _validate_research_methodologies_and_special_topics(db_session, research_methodologies, special_topics):
    """
    Validate that all research methodologies or special topics exist in the database and if they exist, their names match.
    """
    if not research_methodologies and not special_topics:
        return

    _validate_research_methodologies(db_session, research_methodologies)
    _validate_special_topics(db_session, special_topics)


def _validate_research_methodologies(db_session: Session, research_methodologies: List[ResearchMethodology]):
    invalid_research_methodology_ids = []
    for rm in research_methodologies:
        research_methodology = db_session.get(ResearchMethodology, rm["id"])
        if not research_methodology:
            invalid_research_methodology_ids.append(rm["id"])
        else:
            if rm["name"] != research_methodology.name:
                invalid_research_methodology_ids.append(rm["id"])
            elif rm["detailed_name"] != research_methodology.detailed_name:
                invalid_research_methodology_ids.append(rm["id"])

    if invalid_research_methodology_ids:
        raise ValidationError(
            {"research_methodologies": [f"Research Methodology IDs do not exist: {invalid_research_methodology_ids}"]}
        )


def _validate_special_topics(db_session: Session, special_topics: List[SpecialTopic]):
    invalid_special_topic_ids = []
    for st in special_topics:
        special_topic = db_session.get(SpecialTopic, st["id"])
        if not special_topic:
            invalid_special_topic_ids.append(st["id"])
        else:
            if st["name"] != special_topic.name:
                invalid_special_topic_ids.append(st["id"])

    if invalid_special_topic_ids:
        raise ValidationError({"special_topics": [f"Special Topic IDs do not exist: {invalid_special_topic_ids}"]})


def _compute_agreement_totals(all_results: list[Agreement]) -> dict[str, Any]:
    """Compute aggregate totals across all filtered agreements for summary cards."""
    totals = {
        "total_contract_amount": Decimal("0"),
        "total_partner_amount": Decimal("0"),
        "total_grant_amount": Decimal("0"),
        "total_direct_obligation_amount": Decimal("0"),
        "total_agreements_count": len(all_results),
        "type_counts": {},
        "new_count": 0,
        "new_type_counts": {},
        "continuing_count": 0,
        "continuing_type_counts": {},
    }

    for agreement in all_results:
        ag_type = agreement.agreement_type
        ag_total = agreement.agreement_total

        if ag_type == AgreementType.CONTRACT:
            totals["total_contract_amount"] += ag_total
        elif ag_type in (AgreementType.AA, AgreementType.IAA):
            totals["total_partner_amount"] += ag_total
        elif ag_type == AgreementType.GRANT:
            totals["total_grant_amount"] += ag_total
        elif ag_type == AgreementType.DIRECT_OBLIGATION:
            totals["total_direct_obligation_amount"] += ag_total

        type_key = ag_type.name
        totals["type_counts"][type_key] = totals["type_counts"].get(type_key, 0) + 1

        award = agreement.award_type
        if award == "NEW":
            totals["new_count"] += 1
            totals["new_type_counts"][type_key] = totals["new_type_counts"].get(type_key, 0) + 1
        elif award == "CONTINUING":
            totals["continuing_count"] += 1
            totals["continuing_type_counts"][type_key] = totals["continuing_type_counts"].get(type_key, 0) + 1

    # Convert Decimals to floats for JSON serialization
    for key in [
        "total_contract_amount",
        "total_partner_amount",
        "total_grant_amount",
        "total_direct_obligation_amount",
    ]:
        totals[key] = float(totals[key])

    return totals


def _compute_procurement_overview(all_results: list[Agreement], fiscal_year: int | None) -> dict[str, Any]:
    """Compute procurement overview data grouped by BLI status for a given fiscal year.

    Returns amount and agreement count breakdowns for PLANNED, IN_EXECUTION, and OBLIGATED statuses.
    """
    tracked_statuses = [
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ]

    amount_by_status: dict[BudgetLineItemStatus, Decimal] = {s: Decimal("0") for s in tracked_statuses}
    agreements_by_status: dict[BudgetLineItemStatus, set[int]] = {s: set() for s in tracked_statuses}

    for agreement in all_results:
        for bli in agreement.budget_line_items:
            if fiscal_year is not None and bli.fiscal_year != fiscal_year:
                continue
            if bli.status in amount_by_status:
                amount = bli.amount if bli.amount is not None else Decimal("0")
                fees = bli.fees if bli.fees is not None else Decimal("0")
                amount_by_status[bli.status] += amount + fees
                agreements_by_status[bli.status].add(agreement.id)

    total_amount = sum(amount_by_status.values(), Decimal("0"))
    # Uses all agreements in the query result as the denominator for agreements_percent,
    # including agreements that have no BLIs in the tracked statuses for the given fiscal year.
    # This means per-status percentages may not sum to 100%.
    total_agreements = len(all_results)

    def _percent(value, total):
        if total == 0:
            return 0.0
        return float(round((float(value) / float(total)) * 100))

    status_data = []
    for status in tracked_statuses:
        amount = amount_by_status[status]
        agreement_count = len(agreements_by_status[status])
        status_data.append(
            {
                "status": status.name,
                "label": status.value,
                "amount": float(amount),
                "amount_percent": _percent(amount, total_amount),
                "agreements": agreement_count,
                "agreements_percent": _percent(agreement_count, total_agreements),
            }
        )

    return {
        "status_data": status_data,
        "total_amount": float(total_amount),
        "total_agreements": total_agreements,
    }


def _compute_procurement_step_summary(all_results: list[Agreement], fiscal_year: int | None) -> dict[str, Any]:
    """Compute procurement step summary: agreement counts and dollar amounts per step (1-6).

    Uses each agreement's procurement tracker active_step_number and only considers
    IN_EXECUTION BLIs for the given fiscal year.
    """
    amount_by_step: dict[int, Decimal] = {s: Decimal("0") for s in range(1, 7)}
    agreements_by_step: dict[int, int] = {s: 0 for s in range(1, 7)}

    for agreement in all_results:
        # Find the active tracker for this agreement
        tracker = next(
            (
                tracker
                for tracker in agreement.procurement_trackers
                if tracker.status == ProcurementTrackerStatus.ACTIVE and tracker.active_step_number is not None
            ),
            None,
        )
        if tracker is None:
            continue

        step = tracker.active_step_number
        if step < 1 or step > 6:
            continue

        # Filter BLIs to IN_EXECUTION for the fiscal year
        executing_blis = [
            bli
            for bli in agreement.budget_line_items
            if bli.status == BudgetLineItemStatus.IN_EXECUTION
            and (fiscal_year is None or bli.fiscal_year == fiscal_year)
        ]
        if not executing_blis:
            continue

        agreements_by_step[step] += 1
        for bli in executing_blis:
            amount = bli.amount if bli.amount is not None else Decimal("0")
            fees = bli.fees if bli.fees is not None else Decimal("0")
            amount_by_step[step] += amount + fees

    total_agreement_count = sum(agreements_by_step.values())

    def _percent(value, total):
        if total == 0:
            return 0.0
        return round((value / total) * 100)

    step_data = []
    for step in range(1, 7):
        step_data.append(
            {
                "step": step,
                "agreements": agreements_by_step[step],
                "agreements_percent": _percent(agreements_by_step[step], total_agreement_count),
                "amount": float(amount_by_step[step]),
            }
        )

    return {
        "step_data": step_data,
        "total_agreement_count": total_agreement_count,
    }


def _compute_days_in_procurement_step(
    all_results: list[Agreement], fiscal_year: int | None
) -> dict[int, dict[int, int]]:
    """Compute days in procurement step for each agreement's active step.

    For each agreement with an active procurement tracker:
    - Finds the active step
    - If the step is completed, days = step_completed_date - step_start_date
    - If the step is not completed, days = today - step_start_date

    Returns a nested map: { step_number: { agreement_id: days_in_step } }
    """
    today = date.today()
    days_in_step: dict[int, dict[int, int]] = {}

    for agreement in all_results:
        tracker = next(
            (
                tracker
                for tracker in agreement.procurement_trackers
                if tracker.status == ProcurementTrackerStatus.ACTIVE and tracker.active_step_number is not None
            ),
            None,
        )
        if tracker is None:
            continue

        step_number = tracker.active_step_number
        if step_number < 1 or step_number > 6:
            continue

        active_step = next(
            (step for step in tracker.steps if step.step_number == step_number),
            None,
        )
        if active_step is None or active_step.step_start_date is None:
            continue

        if active_step.step_completed_date:
            diff_days = (active_step.step_completed_date - active_step.step_start_date).days
        else:
            diff_days = (today - active_step.step_start_date).days

        if step_number not in days_in_step:
            days_in_step[step_number] = {}
        days_in_step[step_number][agreement.id] = diff_days

    return days_in_step


def _get_agreements(session: Session, agreement_cls: Type[Agreement], data: dict[str, Any]) -> Sequence[Agreement]:
    query = _build_base_query(agreement_cls)
    query = _apply_filters(query, agreement_cls, data)

    logger.debug(f"query: {query}")
    all_results = session.scalars(query).all()

    return _filter_by_ownership(all_results, data.get("only_my", []))


def _build_base_query(agreement_cls: Type[Agreement]) -> Select[tuple[Agreement]]:
    return (
        select(agreement_cls)
        .distinct()
        .join(BudgetLineItem, isouter=True)
        .join(CAN, isouter=True)
        .options(
            selectinload(agreement_cls.budget_line_items),
        )
        .order_by(agreement_cls.id)
    )


def _apply_filters(query: Select[Agreement], agreement_cls: Type[Agreement], data: dict[str, Any]) -> Select[Agreement]:
    """Apply filters to the query based on the provided data."""
    filters = AgreementFilters.parse_filters(data)
    query = _apply_budget_line_filters(query, data)
    query = _apply_agreement_filters(query, agreement_cls, data, filters.exact_match)
    query = _apply_agreement_specific_filters(query, agreement_cls, data)
    query = _apply_search_filter(query, agreement_cls, data.get("search", []))

    return query


def _apply_budget_line_filters(query: Select[Agreement], data: dict[str, Any]) -> Select[Agreement]:
    """Apply filters related to budget line items."""
    fiscal_years = data.get("fiscal_year", [])
    budget_line_statuses = data.get("budget_line_status", [])
    portfolios = data.get("portfolio", [])

    if fiscal_years:
        query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
    if budget_line_statuses:
        query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
    if portfolios:
        query = query.where(CAN.portfolio_id.in_(portfolios))

    return query


def _apply_agreement_filters(
    query: Select[Agreement],
    agreement_cls: Type[Agreement],
    data: dict[str, Any],
    exact_match: bool = True,
) -> Select[Agreement]:
    """Apply general agreement filters."""
    # Filters that use exact matching
    exact_match_filters = [
        ("project_id", agreement_cls.project_id),
        ("agreement_reason", agreement_cls.agreement_reason),
        ("agreement_type", agreement_cls.agreement_type),
        ("awarding_entity_id", agreement_cls.awarding_entity_id),
        ("project_officer_id", agreement_cls.project_officer_id),
        ("alternate_project_officer_id", agreement_cls.alternate_project_officer_id),
        ("nick_name", agreement_cls.nick_name),
    ]

    for filter_key, column in exact_match_filters:
        values = data.get(filter_key, [])
        if values:
            query = query.where(column.in_(values))

    # Apply name filter with partial or exact matching based on exact_match flag
    # Use OR logic so multiple names return agreements matching ANY of them
    names = data.get("name", [])
    if names:
        name_conditions = []
        for name in names:
            if not name:
                name_conditions.append(agreement_cls.name.is_(None))
            else:
                if exact_match:
                    # Use exact case-insensitive match
                    name_conditions.append(func.lower(agreement_cls.name) == func.lower(name))
                else:
                    # Use ilike for case-insensitive partial match
                    pattern = f"%{name}%"
                    name_conditions.append(func.lower(agreement_cls.name).like(func.lower(pattern), escape="\\"))

        if name_conditions:
            query = query.where(or_(*name_conditions))

    return query


def _apply_agreement_specific_filters(
    query: Select[Agreement], agreement_cls: Type[Agreement], data: dict[str, Any]
) -> Select[Agreement]:
    """Apply filters specific to certain agreement types."""
    # Contract and AA Agreement filters
    if agreement_cls in [ContractAgreement, AaAgreement]:
        contract_filters = [
            ("contract_number", agreement_cls.contract_number),
            ("contract_type", agreement_cls.contract_type),
        ]
        for filter_key, column in contract_filters:
            values = data.get(filter_key, [])
            if values:
                query = query.where(column.in_(values))

    # Contract Agreement specific filters
    if agreement_cls == ContractAgreement:
        delivered_status = data.get("delivered_status", [])
        if delivered_status:
            query = query.where(agreement_cls.delivered_status.in_(delivered_status))

    # Grant Agreement specific filters
    if agreement_cls == GrantAgreement:
        foa = data.get("foa", [])
        if foa:
            query = query.where(agreement_cls.foa.in_(foa))

    return query


def _apply_search_filter(
    query: Select[Agreement], agreement_cls: Type[Agreement], search_terms: list[str]
) -> Select[Agreement]:
    """Apply search filter to agreement names."""
    if search_terms:
        for search_term in search_terms:
            if not search_term:
                query = query.where(agreement_cls.name.is_(None))
            else:
                query = query.where(agreement_cls.name.ilike(f"%{search_term}%"))

    return query


def _filter_by_ownership(results, only_my):
    """
    Filter results based on ownership if 'only_my' is True.
    """
    if only_my and True in only_my:
        return [agreement for agreement in results if associated_with_agreement(agreement.id)]
    return results


def _sort_agreements(results, sort_condition, sort_descending, fiscal_years=None):
    match (sort_condition):
        case AgreementSortCondition.AGREEMENT:
            return sorted(results, key=lambda agreement: agreement.name.casefold(), reverse=sort_descending)
        case AgreementSortCondition.PROJECT:
            return sorted(results, key=project_sort, reverse=sort_descending)
        case AgreementSortCondition.TYPE:
            return sorted(results, key=lambda agreement: str(agreement.agreement_type), reverse=sort_descending)
        case AgreementSortCondition.AGREEMENT_TOTAL:
            return sorted(results, key=agreement_total_sort, reverse=sort_descending)
        case AgreementSortCondition.NEXT_BUDGET_LINE:
            return sorted(results, key=next_budget_line_sort, reverse=sort_descending)
        case AgreementSortCondition.NEXT_OBLIGATE_BY:
            return sorted(results, key=next_obligate_by_sort, reverse=sort_descending)
        case AgreementSortCondition.START:
            return sorted(results, key=start_date_sort, reverse=sort_descending)
        case AgreementSortCondition.END:
            return sorted(results, key=end_date_sort, reverse=sort_descending)
        case AgreementSortCondition.FY_OBLIGATED:
            fy = resolve_fiscal_year(fiscal_years)
            return sorted(results, key=lambda a: fy_obligated_sort(a, fy), reverse=sort_descending)
        case _:
            return results


def project_sort(agreement):
    return agreement.project.title if agreement.project else "TBD"


def agreement_total_sort(agreement):
    return agreement.agreement_total


def next_budget_line_sort(agreement):
    next_bli = _get_next_obligated_bli(agreement.budget_line_items)

    if next_bli:
        amount = next_bli.amount if next_bli.amount is not None else Decimal("0")
        total = amount + next_bli.fees
        return total
    else:
        return Decimal("0")


def next_obligate_by_sort(agreement):
    next_bli = _get_next_obligated_bli(agreement.budget_line_items)

    return next_bli.date_needed if next_bli else date.today()


def start_date_sort(agreement):
    return agreement.sc_start_date or date.max


def end_date_sort(agreement):
    return agreement.sc_end_date or date.max


def resolve_fiscal_year(fiscal_years):
    """Get the effective fiscal year from filter list, defaulting to current FY."""
    if fiscal_years and len(fiscal_years) == 1:
        return int(fiscal_years[0])
    if fiscal_years and len(fiscal_years) > 1:
        logger.debug(f"Multiple fiscal years provided ({fiscal_years}); falling back to current FY.")
    return get_current_fiscal_year()


def fy_obligated_sort(agreement, fiscal_year):
    """Sum of (amount + fees) for OBLIGATED BLIs in the given fiscal year."""
    return agreement.fy_obligated(fiscal_year)


def _get_next_obligated_bli(budget_line_items):
    next_bli = None
    for bli in budget_line_items:
        if bli.status != BudgetLineItemStatus.DRAFT and bli.date_needed and bli.date_needed >= date.today():
            if not next_bli or bli.date_needed < next_bli.date_needed:
                next_bli = bli
    return next_bli
