from dataclasses import dataclass
from typing import ClassVar, Optional

from marshmallow import Schema, fields
from models import ContractType
from models.cans import AgreementReason, AgreementType
from ops_api.ops.dataclass_schemas.team_members import TeamMembers


@dataclass
class AgreementData:
    _subclasses: ClassVar[dict[Optional[AgreementType], type["AgreementData"]]] = {}
    _schemas: ClassVar[dict[Optional[AgreementType], Schema]] = {}
    name: str
    agreement_type: AgreementType = fields.Enum(AgreementType)
    display_name: Optional[str] = None
    description: Optional[str] = None
    product_service_code_id: Optional[int] = None
    agreement_reason: Optional[AgreementReason] = None
    incumbent: Optional[str] = None
    project_officer: Optional[int] = None
    team_members: Optional[list[TeamMembers]] = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )
    research_project_id: Optional[int] = None
    procurement_shop_id: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class ContractAgreementData(AgreementData):
    contract_number: Optional[str] = None
    vendor: Optional[str] = None
    delivered_status: Optional[bool] = fields.Boolean(default=False)
    contract_type: Optional[ContractType] = fields.Enum(ContractType)
    support_contacts: Optional[list[TeamMembers]] = fields.List(
        fields.Nested(TeamMembers),
        default=[],
    )


@dataclass
class GrantAgreementData(AgreementData):
    foa: Optional[str] = None


@dataclass
class DirectAgreementData(AgreementData):
    pass


@dataclass
class IaaAgreementData(AgreementData):
    pass


@dataclass
class IaaAaAgreementData(AgreementData):
    pass
