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
 * @param {[]} budgetLines - The list of items to calculate the total cost for.
 * @param {number} fee - The fee per item.
 * @returns {number} The total cost of the items.
 */
const calculateTotal = (budgetLines, fee) => {
    return budgetLines
        ?.filter(({ status }) => status !== BLI_STATUS.DRAFT)
        .reduce((acc, { amount }) => acc + amount * fee, 0);
};

/**
 * Calculates the procurement shop subtotal based on the agreement and budget lines.
 * @param {Object} agreement - The agreement object.
 * @param {[]} [budgetLines] - The array of budget line items.
 * @returns {number} - The procurement shop subtotal.
 */
export const getProcurementShopSubTotal = (agreement, budgetLines = []) => {
    handleAgreementProp(agreement);
    if (!agreement.procurement_shop) {
        return 0;
    }

    const fee = agreement.procurement_shop.fee;

    if (budgetLines.length > 0) {
        return calculateTotal(budgetLines, fee);
    }

    return calculateTotal(agreement.budget_line_items, fee);
};

export const cleanAgreementForApi = (data) => {
    // eslint-disable-next-line no-unused-vars
    const { id, budget_line_items, services_components, created_by, created_on, updated_on, ...cleanData } = data;
    return { id: id, cleanData: cleanData };
};
