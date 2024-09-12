from marshmallow import Schema, fields

from models import AgreementReason, AgreementType, ContractType, ServiceRequirementType
from ops_api.ops.schemas.budget_line_items import BudgetLineItemResponseSchema
from ops_api.ops.schemas.procurement_shops import ProcurementShopSchema
from ops_api.ops.schemas.product_service_code import ProductServiceCodeSchema
from ops_api.ops.schemas.projects import ProjectSchema
from ops_api.ops.schemas.team_members import TeamMembers


class Vendor(Schema):
    name = fields.String(required=True)


class Incumbent(Schema):
    name = fields.String(required=True)


class AgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer_id = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    project_id = fields.Integer(allow_none=True)
    awarding_entity_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
    procurement_tracker_id = fields.Integer(allow_none=True)


class ContractAgreementData(AgreementData):
    contract_number = fields.String(allow_none=True)
    incumbent = fields.String(allow_none=True)
    vendor = fields.String(allow_none=True)
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)


class GrantAgreementData(AgreementData):
    foa = fields.String(allow_none=True)


class DirectAgreementData(AgreementData):
    pass


class IaaAgreementData(AgreementData):
    pass


class IaaAaAgreementData(AgreementData):
    pass


class AgreementResponse(AgreementData):
    id = fields.Integer(required=True)
    project = fields.Nested(ProjectSchema())
    product_service_code = fields.Nested(ProductServiceCodeSchema)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema), allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema)
    display_name = fields.String(required=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class ContractAgreementResponse(AgreementResponse):
    contract_number = fields.String(allow_none=True)
    incumbent = fields.Pluck("Incumbent", "name")
    incumbent_id = fields.Integer(allow_none=True)
    vendor_id = fields.Integer(allow_none=True)
    vendor = fields.Pluck("Vendor", "name")
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    service_requirement_type = fields.Enum(ServiceRequirementType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)


class GrantAgreementResponse(AgreementResponse):
    foa = fields.String(allow_none=True)


class DirectAgreementResponse(AgreementResponse):
    pass


class IaaAgreementResponse(AgreementResponse):
    iaa = fields.String(required=True)
    pass


class IaaAaAgreementResponse(AgreementResponse):
    pass
