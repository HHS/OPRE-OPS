import { AgreementType } from "../pages/agreements/agreements.constants";
import { BLI_STATUS } from "./budgetLines.helpers";

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
 * @param {Object} agreement - The agreement object.
 * @returns {number} - The agreement subtotal.
 */
export const getAgreementSubTotal = (agreement) => {
    handleAgreementProp(agreement);
    return (
        agreement.budget_line_items
            ?.filter(({ status }) => status !== BLI_STATUS.DRAFT)
            .reduce((n, { amount }) => n + amount, 0) || 0
    );
};

/**
 * Calculates the total cost of a list of items, taking into account a fee per item and non-DRAFT budgetlines.
 * @param {import("../components/BudgetLineItems/BudgetLineTypes").BudgetLine[]} budgetLines - The list of items to calculate the total cost for.
 * @param {number} fee - The fee per item.like 0.005
 * @returns {number} The total cost of the items.
 */
const calculateTotal = (budgetLines, fee, isAfterApproval = false) => {
    return (
        budgetLines
            ?.filter(({ status }) => (isAfterApproval ? true : status !== BLI_STATUS.DRAFT))
            .reduce((acc, { amount = 0 }) => acc + amount * fee, 0) || 0
    );
};

/**
 * Calculates the procurement shop subtotal based on the agreement and budget lines.
 * @param {import("../components/Agreements/AgreementTypes").Agreement} agreement - The agreement object.
 * @param {import("../components/BudgetLineItems/BudgetLineTypes").BudgetLine[]} [budgetLines] - The array of budget line items.
 * @returns {number} - The procurement shop subtotal.
 */
export const getProcurementShopSubTotal = (agreement, budgetLines = [], isAfterApproval = false) => {
    handleAgreementProp(agreement);
    if (!agreement.procurement_shop) {
        return 0;
    }

    const fee = agreement.procurement_shop.fee;

    if (budgetLines.length > 0) {
        return calculateTotal(budgetLines, fee, isAfterApproval);
    }

    return calculateTotal(agreement.budget_line_items, fee, isAfterApproval);
};

/**
 * Determines if the agreement is not a contract based on the agreement type.
 * @param {string} agreementType - The type of the agreement.
 * @param {string} procurementShop - The type of the procurementShop.
 * @returns {boolean} - True if the agreement is not a contract, otherwise false.
 */
export const isNonContract = (agreementType, procurementShop) => {
    if (!procurementShop) return false;

    // This is a AA agreement type
    if (agreementType === AgreementType.CONTRACT && procurementShop !== "GCS") return true;

    if (
        agreementType === AgreementType.GRANT ||
        agreementType === AgreementType.DIRECT_OBLIGATION ||
        agreementType === AgreementType.IAA
    ) {
        return true;
    }
    return false;
};
