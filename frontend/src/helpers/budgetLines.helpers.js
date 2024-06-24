import { formatDateToMonthDayYear } from "./utils";

export const BLI_STATUS = {
    DRAFT: "DRAFT",
    PLANNED: "PLANNED",
    EXECUTING: "IN_EXECUTION",
    OBLIGATED: "OBLIGATED"
};

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

/**
 * Returns the total amount of a budget line.
 * @param {Object[]} budgetLines - The budget line to get the total amount from.
 * @returns {Object | null} The total amount of the budget line.
 */
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

/**
 * Returns an array of budget lines that are not in draft status.
 * @param {Object[]} budgetLines - The budget lines to filter.
 * @returns {Object[]} An array of budget lines that are not in draft status.
 */
export const getNonDRAFTBudgetLines = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines?.filter((bli) => bli.status !== BLI_STATUS.DRAFT);
};
/**
 * Returns a boolean indicating if any of the budget lines are in review.
 * @param {Object[]} budgetLines - The budget lines to check.
 * @returns {boolean} Whether any of the budget lines are in review.
 */
export const hasBlIsInReview = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines?.some((bli) => bli.in_review);
};

/**
 * Returns an array of budget lines grouped by services component.
 * @param {Object[]} budgetLines - The budget lines to group.
 * @returns {Object[]} An array of budget lines grouped by services component.
 
 */
export const groupByServicesComponent = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines
        .reduce((acc, budgetLine) => {
            const servicesComponentId = budgetLine.services_component_id;
            const index = acc.findIndex((item) => item.servicesComponentId === servicesComponentId);
            if (index === -1) {
                acc.push({ servicesComponentId, budgetLines: [budgetLine] });
            } else {
                acc[index].budgetLines.push(budgetLine);
            }
            return acc;
        }, [])
        .sort((a, b) => {
            if (a.servicesComponentId === null) return 1;
            if (b.servicesComponentId === null) return -1;
            return a.servicesComponentId - b.servicesComponentId;
        });
};

/**
 * Returns whether the given budget line is permanent.
 * @param {Object} budgetLine - The budget line to check.
 * @returns {boolean} Whether the budget line is permanent.
 */
export const isBLIPermanent = (budgetLine) => {
    handleBLIProp(budgetLine);

    return budgetLine?.created_on ? true : false;
};

/**
 * Returns the display can label of a budget line.
 * @param {Object} budgetLine - The budget line to get the can label from.
 * @returns {string} The can label of the budget line.
 * canDisplayName is for temporary BLIs, can.number is for permanent BLIs
 */
export const canLabel = (budgetLine) =>
    isBLIPermanent(budgetLine) ? budgetLine?.can?.display_name : budgetLine?.canDisplayName || "TBD";

/**
 * Returns display label of a budget line.
 * @param {Object} budgetLine - The budget line to get the BLI label from.
 * @returns {string} The BLI label of the budget line.
 */
export const BLILabel = (budgetLine) => (isBLIPermanent(budgetLine) ? budgetLine?.id : "TBD");
