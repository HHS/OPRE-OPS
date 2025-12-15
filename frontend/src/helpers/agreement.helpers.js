import { omit } from "lodash";
import { AGREEMENT_TYPES } from "../components/ServicesComponents/ServicesComponents.constants";
import { NO_DATA } from "../constants";
import { AgreementFields, AgreementType } from "../pages/agreements/agreements.constants";
import { BLI_STATUS } from "./budgetLines.helpers";
import { convertCodeForDisplay } from "./utils";

/**
 * Validates if the given budget line is an object.
 * @param {Object} agreement - The agreement object.
 * @throws {Error} Will throw an error if the budget line is not an object.
 */
const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

/**
 * Calculates the agreement subtotal based on the agreement and non-DRAFT budget lines.
 * @param {import("../types/AgreementTypes").Agreement} agreement - The agreement object.
 * @returns {number} - The agreement subtotal.
 */
export const getAgreementSubTotal = (agreement) => {
    handleAgreementProp(agreement);

    return (
        agreement.budget_line_items
            ?.filter(({ status, is_obe }) => is_obe || status !== BLI_STATUS.DRAFT)
            .reduce((n, { amount }) => n + amount, 0) || 0
    );
};

/**
 * Calculates the total cost of a list of items, taking into account a fee per item and non-DRAFT budgetlines.
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} budgetLines - The list of items to calculate the total cost for.
 * @param {number | null} feeRate - The fee rate as a percentage (e.g., 5 for 5%).
 * @param {boolean} [includeDraftBLIs] - Whether to include DRAFT budget lines or not.
 * @returns {number} The total cost of the items.
 */
export const calculateAgreementTotal = (budgetLines, feeRate = null, includeDraftBLIs = false) => {
    return (
        budgetLines
            ?.filter(({ status, is_obe }) => (is_obe || includeDraftBLIs ? true : status !== BLI_STATUS.DRAFT))
            .reduce(
                (acc, { amount = 0, fees = 0 }) =>
                    acc +
                    amount +
                    // When feeRate is provided, calculate fees dynamically from the rate
                    // When feeRate is null, use pre-calculated fees from the budget line
                    (feeRate !== null ? amount * (feeRate / 100) : fees),
                0
            ) || 0
    );
};

/**
 * Calculates the procurement shop fee total based on the budget lines and fee rate.
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} budgetLines - The array of budget line items.
 * @param {number} feeRate - The procurement shop fee rate as a percentage (e.g., 5 for 5%).
 * @returns {number} - The procurement shop fee amount only.
 */
export const calculateFeeTotal = (budgetLines, feeRate) => {
    if (feeRate === null || feeRate === 0 || !budgetLines || budgetLines.length === 0) {
        return 0;
    }

    return (
        budgetLines
            ?.filter(({ status }) => status !== BLI_STATUS.DRAFT)
            .reduce((acc, { amount = 0 }) => acc + amount * (feeRate / 100), 0) || 0
    );
};

/**
 * Calculates the procurement shop fees based on the agreement and budget lines.
 * @param {import("../types/AgreementTypes").Agreement} agreement - The agreement object.
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} [budgetLines=[]] - The array of budget line items.
 * @param {boolean} [isAfterApproval=false] - Whether to include DRAFT budget lines or not.
 * @param {number | null} [feeRate=null] - The fee rate as a percentage (e.g., 5 for 5%). If null, uses the agreement's procurement shop fee percentage.
 * @returns {number} - The procurement shop fees.
 */
export const getProcurementShopFees = (agreement, budgetLines = [], isAfterApproval = false, feeRate = null) => {
    handleAgreementProp(agreement);
    if (!agreement.procurement_shop && feeRate === null) {
        return 0;
    }

    const actualFeeRate = feeRate !== null ? feeRate : (agreement.procurement_shop?.fee_percentage ?? 0);

    const lines = budgetLines.length > 0 ? budgetLines : agreement.budget_line_items;

    return (
        lines
            ?.filter(({ status }) => (isAfterApproval ? true : status !== BLI_STATUS.DRAFT))
            .reduce((acc, { amount = 0 }) => acc + amount * (actualFeeRate / 100), 0) || 0
    );
};

/**
 * Gets the total fees from backend-calculated BLI fees property.
 * This should be used for displaying current agreement totals (not what-if calculations).
 * OBE BLI fees are also included in the total fees.
 * @param {import("../types/AgreementTypes").Agreement} agreement - The agreement object.
 * @param {boolean} [isAfterApproval=false] - Whether to include DRAFT budget lines or not.
 * @returns {number} - The total fees from backend calculations.
 */
export const getAgreementFeesFromBackend = (agreement, isAfterApproval = false) => {
    handleAgreementProp(agreement);

    return (
        agreement.budget_line_items
            ?.filter(({ status, is_obe }) => (isAfterApproval ? true : is_obe || status !== BLI_STATUS.DRAFT))
            .reduce((acc, { fees = 0 }) => acc + fees, 0) || 0
    );
};

/**
 * Calculates the procurement shop subtotal based on the agreement and budget lines.
 * @param {import("../types/AgreementTypes").Agreement} agreement - The agreement object.
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} [budgetLines] - The array of budget line items.
 * @returns {number} - The procurement shop subtotal.
 */
export const getProcurementShopSubTotal = (agreement, budgetLines = [], isAfterApproval = false) => {
    handleAgreementProp(agreement);
    if (!agreement.procurement_shop) {
        return 0;
    }

    const feeRate = agreement.procurement_shop.fee_percentage;
    if (budgetLines.length > 0) {
        return calculateAgreementTotal(budgetLines, feeRate, isAfterApproval);
    }

    return calculateAgreementTotal(agreement.budget_line_items, feeRate, isAfterApproval);
};

/**
 * Determines if the agreement is not developed yet based on the agreement type and procurement shop.
 * @param {string} agreementType - The type of the agreement.
 * @returns {boolean} - True if the agreement is not developed yet, otherwise false.
 */
export const isNotDevelopedYet = (agreementType) => {
    if (
        agreementType === AgreementType.GRANT ||
        agreementType === AgreementType.DIRECT_OBLIGATION ||
        agreementType === AgreementType.IAA
    ) {
        return true;
    }

    return false;
};

/**
 * @param {AgreementType} agreementType
 * @param {boolean} showAllPartners - Whether to show all partner types or not.
 * @returns {string} - The label for the agreement type.
 */

export const getAgreementType = (agreementType, showAllPartners = true) => {
    if (!agreementType) {
        console.error("Agreement type is undefined or null");
        return NO_DATA;
    }

    let agreementTypeLabel = convertCodeForDisplay("agreementType", agreementType);

    if ((agreementType === AGREEMENT_TYPES.AA || agreementType === AGREEMENT_TYPES.IAA) && showAllPartners === false) {
        agreementTypeLabel = "Partner (IAA, AA, IDDA, IPA)";
    }

    return agreementTypeLabel;
};

/**
 * @param {AgreementType} agreementType
 * @param {boolean} abbr - Whether to show the abbreviation or not.
 * @returns {string} - The label for the agreement type.
 */

export const getPartnerType = (agreementType, abbr = true) => {
    if (!agreementType) {
        console.error("Agreement type is undefined or null");
        return NO_DATA;
    }

    let agreementTypeLabel = convertCodeForDisplay("agreementType", agreementType);

    if (agreementType === AGREEMENT_TYPES.AA && abbr === false) {
        agreementTypeLabel = "Assisted Acquisition (AA)";
    }

    if (agreementType === AGREEMENT_TYPES.IAA && abbr === false) {
        agreementTypeLabel = "Inter-Agency Agreements (IAA)";
    }

    return agreementTypeLabel;
};

/**
 *
 * @param {AgreementType} agreementType
 * @returns {string}
 */
export const getFundingMethod = (agreementType) => {
    if (agreementType === AgreementType.AA) {
        return "Advanced Funding";
    }
    return NO_DATA;
};

// Mapping of AgreementType to the set of visible AgreementFields
const AGREEMENT_TYPE_VISIBLE_FIELDS = {
    [AgreementType.CONTRACT]: new Set([
        AgreementFields.DescriptionAndNotes,
        AgreementFields.ContractType,
        AgreementFields.ServiceRequirementType,
        AgreementFields.ProductServiceCode,
        AgreementFields.ProcurementShop,
        AgreementFields.ProgramSupportCode,
        AgreementFields.AgreementReason,
        AgreementFields.DivisionDirectors,
        AgreementFields.TeamLeaders,
        AgreementFields.Vendor,
        AgreementFields.NickName,
        AgreementFields.Methodologies,
        AgreementFields.SpecialTopic
    ]),
    [AgreementType.AA]: new Set([
        AgreementFields.DescriptionAndNotes,
        AgreementFields.ContractType,
        AgreementFields.ServiceRequirementType,
        AgreementFields.ProductServiceCode,
        AgreementFields.ProcurementShop,
        AgreementFields.ProgramSupportCode,
        AgreementFields.AgreementReason,
        AgreementFields.DivisionDirectors,
        AgreementFields.TeamLeaders,
        AgreementFields.Vendor,
        AgreementFields.PartnerType,
        AgreementFields.FundingMethod,
        AgreementFields.RequestingAgency,
        AgreementFields.ServicingAgency,
        AgreementFields.Methodologies,
        AgreementFields.SpecialTopic,
        AgreementFields.NickName,
        AgreementFields.SpecialTopic,
        AgreementFields.Methodologies
    ])
    // Add new AgreementTypes here
};

/**
 * @param {AgreementType} agreementType
 * @param {AgreementFields} field
 * @returns
 */
export const isFieldVisible = (agreementType, field) => {
    const visibleFields = AGREEMENT_TYPE_VISIBLE_FIELDS[agreementType];
    return visibleFields ? visibleFields.has(field) : false;
};

/**
 *
 * @param {import("../types/AgreementTypes").Agreement} data
 * @returns
 */

export const cleanAgreementForApi = (data) => {
    const fieldsToRemove = [
        "_meta",
        "budget_line_items",
        "change_requests_in_review",
        "id",
        "in_review",
        "procurement_shop",
        "requesting_agency",
        "servicing_agency", // These two agency objects are not used in the backend. No need to pass them
        "services_components",
        "created_by",
        "created_on",
        "updated_by",
        "updated_on"
    ];

    return {
        id: data.id,
        cleanData: omit(data, fieldsToRemove)
    };
};

/**
 * A utility function to remove unnecessary fields from budget line items before sending to the API.
 * This will lower payload size and avoid potential App Gateway errors due to invalid characters.
 * @param {*} budgetLineItems
 * @returns
 */
export const cleanBudgetLineItemsForApi = (budgetLineItems) => {
    return budgetLineItems.map((bli) => {
        const { data: cleanedBLI } = cleanBudgetLineItemForApi(bli);
        return cleanedBLI;
    });
};

/**
 * A utility function to remove unnecessary fields from a budget line item before sending to the API.
 */
export const cleanBudgetLineItemForApi = (data) => {
    const cleanData = { ...data };
    if (data.services_component_id === 0) {
        cleanData.services_component_id = null;
    }
    if (cleanData.date_needed === "--") {
        cleanData.date_needed = null;
    }
    const budgetLineId = cleanData.id;
    delete cleanData.created_by;
    delete cleanData.created_on;
    delete cleanData.updated_on;
    delete cleanData.can;
    delete cleanData.id;
    delete cleanData.in_review;
    delete cleanData.canDisplayName;
    delete cleanData.versions;
    delete cleanData.clin;
    delete cleanData.agreement;
    delete cleanData.financialSnapshotChanged;
    delete cleanData.fees;
    delete cleanData.display_title;
    delete cleanData.services_component_number;
    delete cleanData._meta;
    delete cleanData.tempChangeRequest;
    delete cleanData.financialSnapshot;
    delete cleanData.serviceComponentGroupingLabel;
    delete cleanData._meta;

    return { id: budgetLineId, data: cleanData };
};

export const formatTeamMember = (team_member) => {
    return {
        id: team_member.id,
        full_name: team_member.full_name,
        email: team_member.email
    };
};
