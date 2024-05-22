from models import DirectAgreement, GrantAgreement, IaaAaAgreement, IaaAgreement
from models.cans import AgreementType, ContractAgreement
from ops_api.ops.schemas.agreements import (
    ContractAgreementData,
    ContractAgreementResponse,
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
    AgreementType.DIRECT_ALLOCATION: DirectAgreement,
    AgreementType.IAA_AA: IaaAaAgreement,
}


AGREEMENT_TYPE_TO_DATACLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementData,
    AgreementType.GRANT: GrantAgreementData,
    AgreementType.IAA: IaaAgreementData,
    AgreementType.DIRECT_ALLOCATION: DirectAgreementData,
    AgreementType.IAA_AA: IaaAaAgreementData,
}

AGREEMENT_TYPE_TO_RESPONSE_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementResponse,
    AgreementType.GRANT: GrantAgreementResponse,
    AgreementType.IAA: IaaAgreementResponse,
    AgreementType.DIRECT_ALLOCATION: DirectAgreementResponse,
    AgreementType.IAA_AA: IaaAaAgreementResponse,
}

AGREEMENTS_REQUEST_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_ALLOCATION: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.DIRECT_ALLOCATION)(),
    AgreementType.IAA_AA: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA_AA)(),
}

AGREEMENT_RESPONSE_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_ALLOCATION: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.DIRECT_ALLOCATION)(),
    AgreementType.IAA_AA: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
    # IAA_AA as the Miscellaneous type type under its mapper args in cans.py so mapping misc to IAA_AA
    AgreementType.MISCELLANEOUS: AGREEMENT_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
}
