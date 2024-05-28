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
    return budgetLines?.filter((bli) => bli.status !== BLI_STATUS.DRAFT);
};
// TODO: Should we be checking for `in_review` here?
// TODO: Are workflows deprecated?
export const hasActiveWorkflow = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines?.some((bli) => bli.has_active_workflow);
};

export const hasBlIsInReview = (budgetLines) => {
    handleBLIProp(budgetLines);
    return budgetLines?.some((bli) => bli.in_review);
};

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

export const isBLIPermanent = (bli) => {
    handleBLIProp(bli);
    return bli?.created_on;
};

export const canLabel = (bli) => (isBLIPermanent(bli) ? bli?.can?.display_name : bli?.canDisplayName);

export const BLILabel = (bli) => (isBLIPermanent(bli) ? bli?.id : "TBD");
