from dataclasses import dataclass, field
from typing import Optional

from marshmallow_enum import EnumField
from models import ContractType
from models.cans import AgreementReason, AgreementType
from ops_api.ops.dataclass_schemas.team_members import TeamMembers


@dataclass
class AgreementData:
    name: str
    agreement_type: AgreementType = EnumField(AgreementType)
    description: Optional[str] = None
    product_service_code_id: Optional[int] = None
    agreement_reason: Optional[AgreementReason] = None
    incumbent: Optional[str] = None
    project_officer: Optional[int] = None
    team_members: Optional[list[TeamMembers]] = field(default_factory=lambda: [])
    research_project_id: Optional[int] = None
    procurement_shop_id: Optional[int] = None
    notes: Optional[str] = None


@dataclass
class ContractAgreementData(AgreementData):
    contract_number: Optional[str] = None
    vendor: Optional[str] = None
    delivered_status: Optional[bool] = field(default=False)
    contract_type: Optional[ContractType] = EnumField(ContractType)
    support_contacts: Optional[list[TeamMembers]] = field(default_factory=lambda: [])


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
