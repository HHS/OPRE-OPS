from marshmallow import Schema, fields
from models import ContractType
from models.cans import AgreementReason, AgreementType
from ops_api.ops.schemas.team_members import TeamMembers


class ContractAgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    research_project_id = fields.Integer(allow_none=True)
    procurement_shop_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
    contract_number = fields.String(allow_none=True)
    vendor = fields.String(allow_none=True)
    delivered_status = fields.Bool(default=False)
    contract_type = fields.Enum(ContractType, allow_none=True)
    support_contacts = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)


class GrantAgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    research_project_id = fields.Integer(allow_none=True)
    procurement_shop_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
    foa = fields.String(allow_none=True)


class DirectAgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    research_project_id = fields.Integer(allow_none=True)
    procurement_shop_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)


class IaaAgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    research_project_id = fields.Integer(allow_none=True)
    procurement_shop_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)


class IaaAaAgreementData(Schema):
    name = fields.String(required=True)
    agreement_type = fields.Enum(AgreementType, required=True)
    description = fields.String(allow_none=True)
    product_service_code_id = fields.Integer(allow_none=True)
    agreement_reason = fields.Enum(AgreementReason, allow_none=True)
    incumbent = fields.String(allow_none=True)
    project_officer = fields.Integer(allow_none=True)
    team_members = fields.List(fields.Nested(TeamMembers), default=[], allow_none=True)
    research_project_id = fields.Integer(allow_none=True)
    procurement_shop_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
