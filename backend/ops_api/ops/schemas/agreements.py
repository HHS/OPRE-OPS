from marshmallow_enum import EnumField

from marshmallow import EXCLUDE, Schema, fields
from models import AgreementReason, AgreementSortCondition, AgreementType, ContractType, ServiceRequirementType
from ops_api.ops.schemas.budget_line_items import BudgetLineItemResponseSchema
from ops_api.ops.schemas.procurement_shops import ProcurementShopSchema
from ops_api.ops.schemas.product_service_code import ProductServiceCodeSchema
from ops_api.ops.schemas.projects import ProjectSchema
from ops_api.ops.schemas.team_members import TeamMembers


class Vendor(Schema):
    name = fields.String(required=True)


class MetaSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    isEditable = fields.Bool(default=False)


class AgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    project_officer_id = fields.Integer(allow_none=True)
    alternate_project_officer_id = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), missing=[], allow_none=True)
    project_id = fields.Integer(allow_none=True)
    awarding_entity_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
    procurement_tracker_id = fields.Integer(allow_none=True)


class ContractAgreementData(AgreementData):
    contract_number = fields.String(allow_none=True)
    vendor = fields.String(allow_none=True)
    delivered_status = fields.Bool(missing=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), missing=[], allow_none=True)


class GrantAgreementData(AgreementData):
    foa = fields.String(allow_none=True)


class DirectAgreementData(AgreementData):
    pass


class IaaAgreementData(AgreementData):
    pass


class IaaAaAgreementData(AgreementData):
    pass


class AgreementRequestSchema(Schema):
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
    foa = fields.List(fields.String(), required=False)
    name = fields.List(fields.String(), required=False)
    search = fields.List(fields.String(), required=False)  # currently an alias for name
    sort_conditions = fields.List(EnumField(AgreementSortCondition), required=False)
    sort_descending = fields.List(fields.Boolean(), required=False)
    only_my = fields.List(fields.Boolean(), required=False)


class AgreementResponse(AgreementData):
    id = fields.Integer(required=True)
    project = fields.Nested(ProjectSchema())
    product_service_code = fields.Nested(ProductServiceCodeSchema)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema), allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema)
    display_name = fields.String(required=True)
    division_directors = fields.List(fields.String(), required=True)
    team_leaders = fields.List(fields.String(), required=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    _meta = fields.Nested(MetaSchema, required=True)


class AgreementListResponse(AgreementData):
    id = fields.Integer(required=True)
    project = fields.Nested(ProjectSchema())
    product_service_code = fields.Nested(ProductServiceCodeSchema)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema, only=["id"]), allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema)
    display_name = fields.String(required=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    _meta = fields.Nested(MetaSchema, required=True)


class ContractAgreementResponse(AgreementResponse):
    contract_number = fields.String(allow_none=True)
    vendor_id = fields.Integer(allow_none=True)
    vendor = fields.Pluck("Vendor", "name")
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)


class ContractListAgreementResponse(AgreementListResponse):
    contract_number = fields.String(allow_none=True)
    vendor_id = fields.Integer(allow_none=True)
    vendor = fields.Pluck("Vendor", "name")
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)


class GrantAgreementResponse(AgreementResponse):
    foa = fields.String(allow_none=True)


class GrantListAgreementResponse(AgreementListResponse):
    foa = fields.String(allow_none=True)


class DirectAgreementResponse(AgreementResponse):
    pass


class DirectListAgreementResponse(AgreementListResponse):
    pass


class IaaAgreementResponse(AgreementResponse):
    iaa = fields.String(required=True)


class IaaListAgreementResponse(AgreementListResponse):
    iaa = fields.String(required=True)


class IaaAaAgreementResponse(AgreementResponse):
    pass


class IaaAaListAgreementResponse(AgreementListResponse):
    pass
