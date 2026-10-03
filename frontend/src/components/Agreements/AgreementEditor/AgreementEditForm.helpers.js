import { AgreementFields } from "../../../pages/agreements/agreements.constants";

// Procurement Shop deliberately has NO entry here. AgreementEditForm.hooks.js's
// isProcurementShopDisabled derives entirely from the backend's _meta.procurementShopLockedMessage
// (which already covers the awarded case) — adding one here would resurrect the dead,
// superuser-exempt duplicate of that rule that caused #6312. Don't add it back.
const AWARDED_DISABLED_FIELDS = {
    [AgreementFields.Name]: "name",
    [AgreementFields.ContractType]: "contract_type",
    [AgreementFields.ServiceRequirementType]: "service_requirement_type",
    [AgreementFields.ProductServiceCode]: "product_service_code_id",
    [AgreementFields.AgreementReason]: "agreement_reason",
    [AgreementFields.RequestingAgency]: "requesting_agency_id",
    [AgreementFields.ServicingAgency]: "servicing_agency_id"
};

/**
 * Determines if a field should be disabled based on agreement type and status.
 * @param {string} field - The field to check.
 * @param {Array<string>} immutableFields - The set of immutable fields for the agreement.
 * @param {boolean} [isSuperUser=false] - Whether the user is a super user.
 * @param {boolean} [isAgreementAwarded=false] - Whether the agreement is awarded.
 * @returns {boolean} - True if the field should be disabled, false otherwise.
 */
export const isFieldDisabled = (field, immutableFields, isSuperUser = false, isAgreementAwarded = false) => {
    if (isSuperUser || !isAgreementAwarded) {
        return false;
    }

    const disabledFields = AWARDED_DISABLED_FIELDS[field];

    if (!disabledFields) {
        return false;
    }

    return immutableFields.includes(disabledFields);
};
