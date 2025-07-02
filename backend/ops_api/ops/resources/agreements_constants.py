from models import AaAgreement, AgreementType, ContractAgreement, DirectAgreement, GrantAgreement, IaaAgreement
from ops_api.ops.schemas.agreements import (
    AaAgreementData,
    AaListAgreementResponse,
    ContractAgreementData,
    ContractAgreementResponse,
    ContractListAgreementResponse,
    DirectAgreementData,
    DirectAgreementResponse,
    DirectListAgreementResponse,
    GrantAgreementData,
    GrantAgreementResponse,
    GrantListAgreementResponse,
    IaaAgreementData,
    IaaAgreementResponse,
    IaaListAgreementResponse,
)

ENDPOINT_STRING = "/agreements"


AGREEMENT_TYPE_TO_CLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreement,
    AgreementType.GRANT: GrantAgreement,
    AgreementType.IAA: IaaAgreement,
    AgreementType.DIRECT_OBLIGATION: DirectAgreement,
    AgreementType.AA: AaAgreement,
}


AGREEMENT_TYPE_TO_DATACLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementData,
    AgreementType.GRANT: GrantAgreementData,
    AgreementType.IAA: IaaAgreementData,
    AgreementType.DIRECT_OBLIGATION: DirectAgreementData,
    AgreementType.AA: AaAgreementData,
}

AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING = {
    AgreementType.CONTRACT: ContractListAgreementResponse,
    AgreementType.GRANT: GrantListAgreementResponse,
    AgreementType.IAA: IaaListAgreementResponse,
    AgreementType.DIRECT_OBLIGATION: DirectListAgreementResponse,
    AgreementType.AA: AaListAgreementResponse,
}

AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementResponse,
    AgreementType.GRANT: GrantAgreementResponse,
    AgreementType.IAA: IaaAgreementResponse,
    AgreementType.DIRECT_OBLIGATION: DirectAgreementResponse,
}

AGREEMENTS_REQUEST_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
    AgreementType.AA: AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(AgreementType.AA)(),
}

AGREEMENT_LIST_RESPONSE_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
    AgreementType.AA: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.AA)(),
}

AGREEMENT_ITEM_RESPONSE_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
}
