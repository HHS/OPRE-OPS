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
/**
 * Determines if a field should be disabled based on agreement type and status.
 * @param {string} field - The field to check.
 * @param {string} agreementType - The type of the agreement.
 * @param {boolean} [isAwarded=false] - Whether the agreement is awarded.
 * @param {boolean} [isSuperUser=false] - Whether the user is a super user.
 * @returns {boolean} - True if the field should be disabled, false otherwise.
 */
export const isFieldDisabled = (field, agreementType, isAwarded = false, isSuperUser = false) => {
    if (!isAwarded || isSuperUser) {
        return false;
    }

    const disabledFields = AGREEMENT_TYPE_DISABLED_FIELDS[agreementType];
    return disabledFields ? disabledFields.has(field) : false;
};
