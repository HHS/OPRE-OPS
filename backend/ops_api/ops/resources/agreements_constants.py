from models import AgreementType, ContractAgreement, DirectAgreement, GrantAgreement, IaaAaAgreement, IaaAgreement
from ops_api.ops.schemas.agreements import (
    ContractAgreementData,
    ContractListAgreementResponse,
    DirectAgreementData,
    DirectAgreementResponse,
    GrantAgreementData,
    GrantAgreementResponse,
    IaaAaAgreementData,
    IaaAaAgreementResponse,
    IaaAgreementData,
    IaaAgreementResponse,
)

ENDPOINT_STRING = "/agreements"


AGREEMENT_TYPE_TO_CLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreement,
    AgreementType.GRANT: GrantAgreement,
    AgreementType.IAA: IaaAgreement,
    AgreementType.DIRECT_OBLIGATION: DirectAgreement,
    AgreementType.IAA_AA: IaaAaAgreement,
}


AGREEMENT_TYPE_TO_DATACLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementData,
    AgreementType.GRANT: GrantAgreementData,
    AgreementType.IAA: IaaAgreementData,
    AgreementType.DIRECT_OBLIGATION: DirectAgreementData,
    AgreementType.IAA_AA: IaaAaAgreementData,
}

AGREEMENT_TYPE_TO_RESPONSE_MAPPING = {
    AgreementType.CONTRACT: ContractListAgreementResponse,
    AgreementType.GRANT: GrantAgreementResponse,
    AgreementType.IAA: IaaAgreementResponse,
    AgreementType.DIRECT_OBLIGATION: DirectAgreementResponse,
    AgreementType.IAA_AA: IaaAaAgreementResponse,
}

AGREEMENTS_REQUEST_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
    AgreementType.IAA_AA: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA_AA)(),
}

AGREEMENT_RESPONSE_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
    AgreementType.IAA_AA: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
    # IAA_AA as the Miscellaneous type type under its mapper args in cans.py so mapping misc to IAA_AA
    AgreementType.MISCELLANEOUS: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
}
