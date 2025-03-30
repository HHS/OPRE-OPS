from models import AgreementType, ContractAgreement, DirectAgreement, GrantAgreement, IaaAaAgreement, IaaAgreement
from ops_api.ops.schemas.agreements import (
    ContractAgreementData,
    ContractAgreementResponse,
    ContractListAgreementResponse,
    DirectAgreementData,
    DirectAgreementResponse,
    DirectListAgreementResponse,
    GrantAgreementData,
    GrantAgreementResponse,
    GrantListAgreementResponse,
    IaaAaAgreementData,
    IaaAaAgreementResponse,
    IaaAaListAgreementResponse,
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
    AgreementType.IAA_AA: IaaAaAgreement,
}


AGREEMENT_TYPE_TO_DATACLASS_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementData,
    AgreementType.GRANT: GrantAgreementData,
    AgreementType.IAA: IaaAgreementData,
    AgreementType.DIRECT_OBLIGATION: DirectAgreementData,
    AgreementType.IAA_AA: IaaAaAgreementData,
}

AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING = {
    AgreementType.CONTRACT: ContractListAgreementResponse,
    AgreementType.GRANT: GrantListAgreementResponse,
    AgreementType.IAA: IaaListAgreementResponse,
    AgreementType.DIRECT_OBLIGATION: DirectListAgreementResponse,
    AgreementType.IAA_AA: IaaAaListAgreementResponse,
}

AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING = {
    AgreementType.CONTRACT: ContractAgreementResponse,
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

AGREEMENT_LIST_RESPONSE_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
    AgreementType.IAA_AA: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
    # IAA_AA as the Miscellaneous type type under its mapper args in cans.py so mapping misc to IAA_AA
    AgreementType.MISCELLANEOUS: AGREEMENT_LIST_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
}

AGREEMENT_ITEM_RESPONSE_SCHEMAS = {
    AgreementType.CONTRACT: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.CONTRACT)(),
    AgreementType.GRANT: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.GRANT)(),
    AgreementType.IAA: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA)(),
    AgreementType.DIRECT_OBLIGATION: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.DIRECT_OBLIGATION)(),
    AgreementType.IAA_AA: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
    # IAA_AA as the Miscellaneous type type under its mapper args in cans.py so mapping misc to IAA_AA
    AgreementType.MISCELLANEOUS: AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(AgreementType.IAA_AA)(),
}
