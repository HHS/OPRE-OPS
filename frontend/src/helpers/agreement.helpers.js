/**
 * Validates if the given budget line is an object.
 * @param {Object} agreement - The budget line to validate.
 * @throws {Error} Will throw an error if the budget line is not an object.
 */
const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

// TODO: filter out DRAFT BLIs and UNDER_REVIEW BLIs?
export const getAgreementSubTotal = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.budget_line_items?.reduce((n, { amount }) => n + amount, 0);
};

// TODO: filter out DRAFT BLIs and UNDER_REVIEW BLIs?

/**
 * Calculates the total cost of a list of items, taking into account a fee per item.
 * @param {Array>} items - The list of items to calculate the total cost for.
 * @param {number} fee - The fee per item.
 * @returns {number} The total cost of the items.
 */
const calculateTotal = (items, fee) => {
    return items?.reduce((acc, { amount }) => acc + amount * fee, 0);
};

/**
 * Calculates the procurement shop subtotal based on the agreement and budget lines.
 * @param {Object} agreement - The agreement object.
 * @param {Array} budgetLines - The array of budget line items.
 * @returns {number} - The procurement shop subtotal.
 */
export const getProcurementShopSubTotal = (agreement, budgetLines) => {
    handleAgreementProp(agreement);
    if (!agreement.procurement_shop) {
        return 0;
    }

    const fee = agreement.procurement_shop.fee;

    if (budgetLines) {
        return calculateTotal(budgetLines, fee);
    }

    return calculateTotal(agreement.budget_line_items, fee);
};
