from marshmallow import Schema, fields
from models import ContractType
from models.cans import AgreementReason, AgreementType
from ops_api.ops.schemas.product_service_code import ProductServiceCodeSchema
from ops_api.ops.schemas.team_members import TeamMembers


class AgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer_id = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    research_project_id = fields.Integer(allow_none=True)
    procurement_shop_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)


class ContractAgreementData(AgreementData):
    contract_number = fields.String(allow_none=True)
    vendor = fields.String(allow_none=True)
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)


class GrantAgreementData(AgreementData):
    foa = fields.String(allow_none=True)


class DirectAgreementData(AgreementData):
    pass


class IaaAgreementData(AgreementData):
    pass


class IaaAaAgreementData(AgreementData):
    pass


# TODO: This can go away once we can serialize the Agreement with marshmallow
class AgreementResponse(Schema):
    id = fields.Integer(required=True)
    type = fields.String(required=True)
    name = fields.String(required=True)
    created_by = fields.Integer(required=True)
    description = fields.String(required=True)
    product_service_code = fields.Nested(ProductServiceCodeSchema)
    incumbent = fields.String(required=True)
    project_officer = fields.Nested(TeamMembers)
    research_project = fields.Integer(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    agreement_reason = fields.Enum(AgreementReason)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    budget_line_items = fields.List(fields.Integer(), default=[], allow_none=True)
    procurement_shop = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
