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

export const anyBudgetLinesByStatus = (agreement, status) => {
    handleAgreementProp(agreement);
    let match = false;
    if (agreement?.budget_line_items) {
        match = agreement.budget_line_items.some((item) => item.status === status);
    }
    return match;
};

export const getSelectedBudgetLines = (budgetLines) => {
    handleAgreementProp(budgetLines);
    return budgetLines?.filter((item) => item.selected);
};

export const getSelectedBudgetLinesCanAmounts = (budgetLines) => {
    handleAgreementProp(budgetLines);
    const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
    return selectedBudgetLines.map((item) => item.can_amount);
}

export const selectedBudgetLinesTotal = (budgetLines) => {
    handleAgreementProp(budgetLines);
    const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
    return selectedBudgetLines.reduce((acc, { amount }) => acc + amount, 0);
};

export const selectedBudgetLinesCansTotal = (budgetLines) => {

}
