import { fiscalYearFromDate } from "../../../helpers/utils";

/**
 * Validates that the agreement is an object.
 * @param {Object} prop - The agreement to validate.
 * @throws {Error} If the agreement is not an object.
 */
const handlePropType = (prop) => {
    if (typeof prop !== "object") {
        throw new Error(`Prop must be an object, but got ${typeof prop}`);
    }
};

const handlePropWithoutSelectedProp = (prop) => {
    // eslint-disable-next-line no-prototype-builtins
    if (prop.some((item) => !item.hasOwnProperty("selected"))) {
        throw new Error(`Prop must be an array of objects with a 'selected' property`);
    }
};

export const anyBudgetLinesByStatus = (agreement, status) => {
    handlePropType(agreement);
    let match = false;
    if (agreement?.budget_line_items) {
        match = agreement.budget_line_items.some((item) => item.status === status);
    }
    return match;
};

export const getSelectedBudgetLines = (budgetLines) => {
    handlePropType(budgetLines);
    handlePropWithoutSelectedProp(budgetLines);
    return budgetLines?.filter((item) => item.selected);
};

export const getSelectedBudgetLinesCanAmounts = (budgetLines) => {
    handlePropType(budgetLines);
    const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
    return selectedBudgetLines.map((item) => item.can_amount);
};

export const selectedBudgetLinesTotal = (budgetLines) => {
    handlePropType(budgetLines);
    const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
    return selectedBudgetLines.reduce((acc, { amount }) => acc + amount, 0);
};

export const totalByCan = (accumulator, { can, amount }) => {
    if (!can) {
        return accumulator;
    }
    if (!accumulator[can.number]) {
        accumulator[can.number] = 0;
    }
    accumulator[can.number] += amount;
    return accumulator;
};

export const getTotalBySelectedCans = (budgetLines) => {
    handlePropType(budgetLines);
    const selectedBudgetLines = getSelectedBudgetLines(budgetLines);
    const totalByCans = selectedBudgetLines.reduce(totalByCan, {});
    const cansNumberAndAmount = Object.entries(totalByCans).map(([canNumber, amount]) => ({ canNumber, amount }));
    const canNumbersWithAmountsAndTerms = cansNumberAndAmount.map(({ canNumber, amount }) => {
        const can = selectedBudgetLines.find((item) => item.can.number === canNumber).can;
        return { canNumber, amount, term: can.active_period };
    });
    return canNumbersWithAmountsAndTerms;
};

export const getTotalByCans = (budgetLines) => {
    handlePropType(budgetLines);
    const totalByCans = budgetLines.reduce(totalByCan, {});
    const cansNumberAndAmount = Object.entries(totalByCans).map(([canNumber, amount]) => ({ canNumber, amount }));
    const canNumbersWithAmountsAndTerms = cansNumberAndAmount.map(({ canNumber, amount }) => {
        const can = budgetLines.find((item) => item.can.number === canNumber).can;
        return { canNumber, amount, term: can.active_period };
    });
    return canNumbersWithAmountsAndTerms;
};

export const isBudgetLineInCurrentFiscalYear = (budgetLine) => {
    const currentFiscalYear = fiscalYearFromDate(new Date());
    return fiscalYearFromDate(budgetLine?.date_needed) === currentFiscalYear;
};
