/**
 * Validates that the agreement is an object.
 * @param {Object} agreement - The agreement to validate.
 * @throws {Error} If the agreement is not an object.
 */
const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

/**
 * Returns an array of budget line items based on the provided action and agreement.
 *
 * @param {Object} agreement - The agreement object to filter budget line items from.
 * @param {string} action - The action to perform on the budget line items.
 * @returns {Array<any>} - An array of budget line items based on the provided action and agreement.
 */
export const setActionableBudgetLines = (agreement, action) => {
    handleAgreementProp(agreement);

    switch (action) {
        case "Change Draft Budget Lines to Planned Status":
            return agreement?.budget_line_items.filter((item) => item.status === "DRAFT");
        case "Change Planned Budget Lines to Executing Status":
            return agreement?.budget_line_items.filter((item) => item.status === "PLANNED");
        default:
            return [];
    }
};

export const anyBudgetLinesByStatus = (agreement, status) => {
    handleAgreementProp(agreement);

    return agreement?.budget_line_items.some((item) => item.status === status);
};
