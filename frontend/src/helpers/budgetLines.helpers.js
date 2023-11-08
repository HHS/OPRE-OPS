import { formatDateToMonthDayYear } from "./utils";

/**
 * Validates if the given budget line is an object.
 * @param {Object} budgetLine - The budget line to validate.
 * @throws {Error} Will throw an error if the budget line is not an object.
 */
const handleBLIProp = (budgetLine) => {
    if (typeof budgetLine !== "object") {
        throw new Error(`BudgetLine must be an object, but got ${typeof budgetLine}`);
    }
};

/**
 * Returns the created date of a budget line in a formatted string.
 * If the budget line does not have a created_on property, returns today's date in a formatted string.
 *
 * @param {Object} budgetLine - The budget line object to get the created date from.
 * @returns {string} The formatted created date of the budget line.
 */
export const getBudgetLineCreatedDate = (budgetLine) => {
    handleBLIProp(budgetLine);
    const today = new Date();
    const formattedToday = formatDateToMonthDayYear(today);

    return budgetLine?.created_on ? formatDateToMonthDayYear(budgetLine.created_on) : formattedToday;
};

export const budgetLinesTotal = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines?.reduce((n, { amount }) => n + amount, 0);
};

/**
 * Returns an array of budget lines filtered by status.
 * @param {Object[]} budgetLines - The budget lines to filter.
 * @param {string[]} status - The status to filter by.
 * @returns {Object[]} An array of budget lines filtered by status.
 */
// const notDraftBLIs = agreement.budget_line_items.filter((bli) => !draftBudgetLineStatuses.includes(bli.status));
export const getBudgetByStatus = (budgetLines, status) => {
    handleBLIProp(budgetLines);
    return budgetLines?.filter((bli) => status.includes(bli.status));
};

export const getNonDRAFTBudgetLines = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines?.filter((bli) => bli.status !== "DRAFT" && bli.status !== "IN_REVIEW");
};
