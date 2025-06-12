import { getTypesCounts } from "../pages/cans/detail/Can.helpers";
import { formatDateToMonthDayYear } from "./utils";
/** @typedef {import("../types/BudgetLineTypes").BudgetLine} BudgetLine */

/**
 * Enum representing the possible statuses of a budget line item.
 * @readonly
 * @enum {string}
 * @property {string} DRAFT - Initial status for newly created budget lines.
 * @property {string} PLANNED - Status for budget lines that have been planned but not yet executed.
 * @property {string} EXECUTING - Status for budget lines currently in execution phase.
 * @property {string} OBLIGATED - Status for budget lines that have been fully obligated.
 */
export const BLI_STATUS = {
    DRAFT: "DRAFT",
    PLANNED: "PLANNED",
    EXECUTING: "IN_EXECUTION",
    OBLIGATED: "OBLIGATED",
    OVERCOME_BY_EVENTS: "OVERCOME_BY_EVENTS"
};

/**
 * Validates if the given budget line is an object.
 * @param {BudgetLine} budgetLine - The budget line to validate.
 * @throws {Error} Will throw an error if the budget line is not an object.
 */
const handleBLIProp = (budgetLine) => {
    if (typeof budgetLine !== "object") {
        throw new Error(`BudgetLine must be an object, but got ${typeof budgetLine}`);
    }
};

/**
 * Validates if the given budget lines parameter is an array.
 * @param {BudgetLine[]} budgetLines - The budget lines array to validate.
 * @throws {Error} Will throw an error if the budget lines parameter is not an array.
 */
const handleBLIArrayProp = (budgetLines) => {
    if (!Array.isArray(budgetLines)) {
        throw new Error(`BudgetLines must be an array, but got ${typeof budgetLines}`);
    }
};

/**
 * Returns the created date of a budget line in a formatted string.
 * If the budget line does not have a created_on property, returns today's date in a formatted string.
 *
 * @param {BudgetLine} budgetLine - The budget line object to get the created date from.
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
 * @param {BudgetLine[]} budgetLines - The budget line to get the total amount from.
 * @returns {number} The total amount of the budget line.
 */
export const budgetLinesTotal = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines.reduce((n, { amount }) => n + (amount || 0), 0);
};

/**
 * Returns an array of budget lines filtered by status.
 * @param {BudgetLine[]} budgetLines - The budget lines to filter.
 * @param {string[]} status - The status to filter by.
 * @returns {BudgetLine[]} An array of budget lines filtered by status.
 */
export const getBudgetByStatus = (budgetLines, status) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.filter((bli) => status.includes(bli.status));
};

/**
 * Returns an array of budget lines that are not in draft status.
 * @param {BudgetLine[]} budgetLines - The budget lines to filter.
 * @returns {BudgetLine[]} An array of budget lines that are not in draft status.
 */
export const getNonDRAFTBudgetLines = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.filter((bli) => bli.status !== BLI_STATUS.DRAFT);
};

/**
 * Returns a boolean indicating if any of the budget lines are in review.
 * @param {BudgetLine[]} budgetLines - The budget lines to check.
 * @returns {boolean} Whether any of the budget lines are in review.
 */
export const hasBlIsInReview = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.some((bli) => bli.in_review);
};

/**
 * Returns a boolean indicating if any of the budget lines are obligated.
 * @param {BudgetLine[]} budgetLines - The budget lines to check.
 * @returns {boolean} Whether any of the budget lines are obligated.
 */
export const hasBlIsObligated = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.some((bli) => bli.status === BLI_STATUS.OBLIGATED);
};

/**
 * Returns an array of budget lines grouped by services component.
 * @param {BudgetLine[]} budgetLines - The budget lines to group.
 * @returns {BudgetLine[]} An array of budget lines grouped by services component.
 */
export const groupByServicesComponent = (budgetLines) => {
    try {
        handleBLIArrayProp(budgetLines);

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
    } catch (error) {
        console.error("Error in groupByServicesComponent:", error);
        return [];
    }
};

/**
 * Returns whether the given budget line is permanent.
 * @param {BudgetLine} budgetLine - The budget line to check.
 * @returns {boolean} Whether the budget line is permanent.
 */
export const isBLIPermanent = (budgetLine) => {
    handleBLIProp(budgetLine);

    return budgetLine?.created_on ? true : false;
};

/**
 * Returns the display can label of a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the can label from.
 * @returns {string} The can label of the budget line.
 * canDisplayName is for temporary BLIs, can.number is for permanent BLIs
 */
export const canLabel = (budgetLine) =>
    isBLIPermanent(budgetLine) ? budgetLine?.can?.display_name : budgetLine?.canDisplayName || "TBD";

/**
 * Returns display label of a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the BLI label from.
 * @returns {string} The BLI label of the budget line.
 */
export const BLILabel = (budgetLine) => (isBLIPermanent(budgetLine) ? budgetLine?.id : "TBD");

/**
 * Returns whether the given budget line is editable by status.
 * @param {BudgetLine} budgetLine - The budget line to check.
 * @returns {boolean} Whether the budget line is editable by status.
 **/
export const isBudgetLineEditableByStatus = (budgetLine) => {
    const isBudgetLineDraft = budgetLine?.status === BLI_STATUS.DRAFT;
    const isBudgetLinePlanned = budgetLine?.status === BLI_STATUS.PLANNED;
    const isBudgetLineInReview = budgetLine?.in_review;

    return (isBudgetLineDraft || isBudgetLinePlanned) && !isBudgetLineInReview;
};
/**
 * @typedef ItemCount
 * @property {string} type
 * @property {number} count
 */
/**
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} budgetlines
 * @returns {ItemCount[]}
 */
export const getAgreementTypesCount = (budgetlines) => {
    const budgetLinesAgreements = budgetlines?.filter((item) => item.agreement).map((item) => item.agreement);
    const uniqueBudgetLineAgreements =
        budgetLinesAgreements?.reduce((acc, item) => {
            // Skip if item is null or doesn't have a name
            if (!item?.name) return acc;

            if (!acc.some((existingItem) => existingItem?.name === item.name)) {
                acc.push(item);
            }
            return acc;
        }, []) ?? [];
    const agreementTypesCount = getTypesCounts(uniqueBudgetLineAgreements ?? [], "agreement_type");
    return agreementTypesCount;
};

/**
 * @param {BudgetLine[]} budgetlines
 * @returns {boolean}
 */
export const areAllBudgetLinesInReview = (budgetlines) => {
    if (budgetlines.length === 0) {
        return false;
    }
    return budgetlines.every((bl) => bl.in_review);
};

/**
 * Returns a tooltip label for a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the tooltip label from.
 * @returns {string} The tooltip label of the budget line.
 */
export const getTooltipLabel = (budgetLine) => {
    let label = "";
    if (budgetLine?.status === BLI_STATUS.EXECUTING) {
        label = "If you need to edit a budget line in Executing Status, please contact the budget team";
    } else if (budgetLine?.status === BLI_STATUS.OBLIGATED) {
        label = "Obligated budget lines cannot be edited";
    } else if (budgetLine?.status === BLI_STATUS.OVERCOME_BY_EVENTS) {
        label = "OBE";
    }
    return label;
};
