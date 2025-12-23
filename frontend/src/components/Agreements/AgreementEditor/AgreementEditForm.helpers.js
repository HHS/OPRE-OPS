import { AgreementFields } from "../../../pages/agreements/agreements.constants";

const AWARDED_DISABLED_FIELDS = {
    [AgreementFields.Name]: "name",
    [AgreementFields.ContractType]: "contract_type",
    [AgreementFields.ServiceRequirementType]: "service_requirement_type",
    [AgreementFields.ProductServiceCode]: "product_service_code_id",
    [AgreementFields.ProcurementShop]: "awarding_entity_id",
    [AgreementFields.AgreementReason]: "agreement_reason",
    [AgreementFields.RequestingAgency]: "requesting_agency_id",
    [AgreementFields.ServicingAgency]: "servicing_agency_id"
};

/**
 * Determines if a field should be disabled based on agreement type and status.
 * @param {string} field - The field to check.
 * @param {Array<string>} immutableFields - The set of immutable fields for the agreement.
 * @param {boolean} [isSuperUser=false] - Whether the user is a super user.
 * @returns {boolean} - True if the field should be disabled, false otherwise.
 */
export const isFieldDisabled = (field, immutableFields, isSuperUser = false) => {
    if (isSuperUser) {
        return false;
    }

    const disabledFields = AWARDED_DISABLED_FIELDS[field];

    if (!disabledFields) {
        return false;
    }

    return immutableFields.includes(disabledFields);
};
