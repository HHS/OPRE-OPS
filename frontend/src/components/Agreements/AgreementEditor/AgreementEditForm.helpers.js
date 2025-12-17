import { AgreementType, AgreementFields } from "../../../pages/agreements/agreements.constants";

const AGREEMENT_TYPE_DISABLED_FIELDS = {
    [AgreementType.CONTRACT]: new Set([
        AgreementFields.Name,
        AgreementFields.ContractType,
        AgreementFields.ServiceRequirementType,
        AgreementFields.ProductServiceCode,
        AgreementFields.ProcurementShop,
        AgreementFields.AgreementReason
    ]),
    [AgreementType.AA]: new Set([
        AgreementFields.Name,
        AgreementFields.ContractType,
        AgreementFields.ServiceRequirementType,
        AgreementFields.ProductServiceCode,
        AgreementFields.ProcurementShop,
        AgreementFields.AgreementReason,
        AgreementFields.RequestingAgency,
        AgreementFields.ServicingAgency
    ])
};

export const isFieldDisabled = (field, agreementType, isAwarded = false) => {
    if (!isAwarded) {
        return false;
    }

    const disabledFields = AGREEMENT_TYPE_DISABLED_FIELDS[agreementType];
    return disabledFields ? disabledFields.has(field) : false;
};
