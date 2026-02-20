from marshmallow import EXCLUDE, Schema, fields

from models import (
    AcquisitionType,
    AgreementReason,
    AgreementSortCondition,
    AgreementType,
    ContractCategory,
    ContractType,
    IAADirectionType,
    ServiceRequirementType,
)
from ops_api.ops.schemas.budget_line_items import (
    BudgetLineItemResponseSchema,
    NestedBudgetLineItemRequestSchema,
)
from ops_api.ops.schemas.change_requests import AgreementChangeRequestResponseSchema
from ops_api.ops.schemas.pagination import PaginationListSchema
from ops_api.ops.schemas.procurement_shops import ProcurementShopSchema
from ops_api.ops.schemas.product_service_code import ProductServiceCodeSchema
from ops_api.ops.schemas.projects import ProjectSchema
from ops_api.ops.schemas.research_methodology import ResearchMethodologySchema
from ops_api.ops.schemas.services_component import NestedServicesComponentRequestSchema
from ops_api.ops.schemas.special_topics import SpecialTopicsSchema
from ops_api.ops.schemas.team_members import TeamMembers


class Vendor(Schema):
    name = fields.String(required=True)


class MetaSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    isEditable = fields.Bool(load_default=False, dump_default=False)
    immutable_awarded_fields = fields.List(fields.String(), load_default=None, dump_default=None, required=False)


class AgreementData(Schema):
    """
    Base schema for agreement data, which includes common fields across different agreement types.
    """

    name = fields.String(required=True)
    nick_name = fields.String(allow_none=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    project_officer_id = fields.Integer(allow_none=True)
    alternate_project_officer_id = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), allow_none=True)
    project_id = fields.Integer(allow_none=True)
    awarding_entity_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    maps_sys_id = fields.Integer(allow_none=True)
    special_topics = fields.List(
        fields.Nested(SpecialTopicsSchema),
        required=False,
        allow_none=True,
        load_default=[],
    )
    research_methodologies = fields.List(
        fields.Nested(ResearchMethodologySchema),
        required=False,
        allow_none=True,
        load_default=[],
    )

    # Nested entities for atomic creation
    budget_line_items = fields.List(
        fields.Nested(NestedBudgetLineItemRequestSchema),
        required=False,
        allow_none=True,
        load_default=[],
        metadata={"description": "Budget line items to create with the agreement"},
    )
    services_components = fields.List(
        fields.Nested(NestedServicesComponentRequestSchema),
        required=False,
        allow_none=True,
        load_default=[],
        metadata={"description": "Services components to create with the agreement"},
    )


class ContractAgreementData(AgreementData):
    contract_number = fields.String(allow_none=True)
    vendor = fields.String(allow_none=True)
    delivered_status = fields.Bool(dump_default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), allow_none=True)
    task_order_number = fields.String(allow_none=True)
    po_number = fields.String(allow_none=True)
    acquisition_type = fields.Enum(AcquisitionType, allow_none=True)
    contract_category = fields.Enum(ContractCategory, allow_none=True)
    psc_contract_specialist = fields.String(allow_none=True)
    cotr_id = fields.Integer(allow_none=True)


class GrantAgreementData(AgreementData):
    foa = fields.String(allow_none=True)


class DirectAgreementData(AgreementData):
    pass


class IaaAgreementData(AgreementData):
    direction = fields.Enum(IAADirectionType, required=True)
    iaa_customer_agency_id = fields.Integer(allow_none=True)
    opre_poc = fields.String(allow_none=True)
    agency_poc = fields.String(allow_none=True)


class AaAgreementData(ContractAgreementData):
    requesting_agency_id = fields.Integer()
    servicing_agency_id = fields.Integer()
    service_requirement_type = fields.Enum(ServiceRequirementType)


class AgreementRequestSchema(PaginationListSchema):
    """ "
    Schema used in GET /agreements endpoint to filter agreements.
    """

    class Meta:
        unknown = EXCLUDE

    fiscal_year = fields.List(fields.Integer(), required=False)
    budget_line_status = fields.List(fields.String(), required=False)
    portfolio = fields.List(fields.Integer(), required=False)
    project_id = fields.List(fields.Integer(), required=False)
    agreement_reason = fields.List(fields.String(), required=False)
    contract_number = fields.List(fields.String(), required=False)
    contract_type = fields.List(fields.String(), required=False)
    agreement_type = fields.List(fields.String(), required=False)
    delivered_status = fields.List(fields.String(), required=False)
    awarding_entity_id = fields.List(fields.Integer(), required=False)
    project_officer_id = fields.List(fields.Integer(), required=False)
    alternate_project_officer_id = fields.List(fields.Integer(), required=False)
    nick_name = fields.List(fields.String(), required=False)
    foa = fields.List(fields.String(), required=False)
    name = fields.List(fields.String(), required=False)
    search = fields.List(fields.String(), required=False)  # currently an alias for name
    sort_conditions = fields.List(fields.Enum(AgreementSortCondition), required=False)
    sort_descending = fields.List(fields.Boolean(), required=False)
    only_my = fields.List(fields.Boolean(), required=False)
    exact_match = fields.List(fields.Boolean(), required=False, load_default=[True])


class AgreementFiltersQueryParametersSchema(Schema):
    """Schema for query parameters on the agreements filter options endpoint."""

    class Meta:
        unknown = EXCLUDE

    only_my = fields.List(fields.Boolean(), required=False, load_default=[])


class AgreementResponse(AgreementData):
    """
    Base Schema used in GET /agreements/{id} endpoint to return detailed agreement information.
    """

    id = fields.Integer(required=True)
    project = fields.Nested(ProjectSchema())
    product_service_code = fields.Nested(ProductServiceCodeSchema)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema), allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema)
    display_name = fields.String(required=True)
    division_directors = fields.List(fields.String(), required=True)
    team_leaders = fields.List(fields.String(), required=True)
    in_review = fields.Bool(required=True)
    change_requests_in_review = fields.Nested(
        AgreementChangeRequestResponseSchema,
        many=True,
        dump_default=None,
        allow_none=True,
    )
    authorized_user_ids = fields.List(fields.Integer(), required=True)
    special_topic = fields.Nested(SpecialTopicsSchema)
    is_awarded = fields.Bool(load_default=None, dump_default=None, required=False)
    sc_start_date = fields.Date(allow_none=True)
    sc_end_date = fields.Date(allow_none=True)
    agreement_subtotal = fields.Float(allow_none=True)
    total_agreement_fees = fields.Float(allow_none=True)
    agreement_total = fields.Float(allow_none=True)
    lifetime_obligated = fields.Float(allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    _meta = fields.Nested(MetaSchema, required=True)


class AgreementListResponse(AgreementData):
    """
    Base Schema used in GET /agreements endpoint to return a list of agreements.
    """

    id = fields.Integer(required=True)
    project = fields.Nested(ProjectSchema())
    product_service_code = fields.Nested(ProductServiceCodeSchema)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema, only=["id"]), allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema)
    display_name = fields.String(required=True)
    is_awarded = fields.Bool(load_default=None, dump_default=None, required=False)
    sc_start_date = fields.Date(allow_none=True)
    sc_end_date = fields.Date(allow_none=True)
    agreement_subtotal = fields.Float(allow_none=True)
    total_agreement_fees = fields.Float(allow_none=True)
    agreement_total = fields.Float(allow_none=True)
    lifetime_obligated = fields.Float(allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    _meta = fields.Nested(MetaSchema, required=True)


class ContractAgreementResponse(AgreementResponse):
    contract_number = fields.String(allow_none=True)
    vendor_id = fields.Integer(allow_none=True)
    vendor = fields.Pluck("Vendor", "name")
    delivered_status = fields.Bool(load_default=False, dump_default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), dump_default=[])
    task_order_number = fields.String(allow_none=True)
    po_number = fields.String(allow_none=True)
    acquisition_type = fields.Enum(AcquisitionType, allow_none=True)
    contract_category = fields.Enum(ContractCategory, allow_none=True)
    psc_contract_specialist = fields.String(allow_none=True)
    cotr_id = fields.Integer(allow_none=True)


class ContractListAgreementResponse(AgreementListResponse):
    contract_number = fields.String(allow_none=True)
    vendor_id = fields.Integer(allow_none=True)
    vendor = fields.Pluck("Vendor", "name")
    delivered_status = fields.Bool(load_default=False, dump_default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), dump_default=[])
    task_order_number = fields.String(allow_none=True)
    po_number = fields.String(allow_none=True)
    acquisition_type = fields.Enum(AcquisitionType, allow_none=True)
    contract_category = fields.Enum(ContractCategory, allow_none=True)
    psc_contract_specialist = fields.String(allow_none=True)
    cotr_id = fields.Integer(allow_none=True)


class GrantAgreementResponse(AgreementResponse):
    foa = fields.String(allow_none=True)


class GrantListAgreementResponse(AgreementListResponse):
    foa = fields.String(allow_none=True)


class DirectAgreementResponse(AgreementResponse):
    pass


class AgreementAgencySchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbreviation = fields.String(required=True)
    requesting = fields.Bool(required=True)
    servicing = fields.Bool(required=True)


class AaAgreementResponse(ContractAgreementResponse):
    requesting_agency = fields.Nested(AgreementAgencySchema, required=True)
    servicing_agency = fields.Nested(AgreementAgencySchema, required=True)


class DirectListAgreementResponse(AgreementListResponse):
    pass


class IaaAgreementResponse(AgreementResponse):
    iaa = fields.String(required=True)


class AaListAgreementResponse(ContractListAgreementResponse):
    requesting_agency = fields.Nested(AgreementAgencySchema, required=True)
    servicing_agency = fields.Nested(AgreementAgencySchema, required=True)


class IaaListAgreementResponse(AgreementListResponse):
    iaa = fields.String(required=True)


class AgreementListFilterOptionResponseSchema(Schema):
    """Schema for the response from the agreements filter options endpoint."""

    fiscal_years = fields.List(fields.Int(), required=True)
    portfolios = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    project_titles = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    agreement_types = fields.List(fields.String(), required=True)
    agreement_names = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    contract_numbers = fields.List(fields.String(), required=True)
    research_types = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
