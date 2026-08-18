import { NO_DATA } from "../../../constants";

/**
 * Returns a CSS class name indicating whether the given budget line item's date is in the future or not.
 * @param {string | null} item - The budget line item's date.
 * @param {boolean} isReviewMode - Whether the table is in review mode or not.
 * @returns {string} - The CSS class name to apply to the table item.
 */
export const futureDateErrorClass = (item, isReviewMode) => {
    const today = new Date().valueOf();
    const dateNeeded = new Date(item).valueOf();

    if (isReviewMode && dateNeeded < today) {
        return "table-item-error";
    } else {
        return "";
    }
};

/**
 * Adds an error class to a table item if it is not found and the component is in review mode.
 * @param {any} item - The item to check for existence.
 * @param {boolean} isReviewMode - A flag indicating whether the component is in review mode.
 * @returns {string} - The CSS class to apply to the table item.
 */
export const addErrorClassIfNotFound = (item, isReviewMode) => {
    return isReviewMode && (!item || item === NO_DATA) ? "table-item-error" : "";
};

/**
 * Whether a budget line's Obligate By date (date_needed) falls outside its services
 * component's PoP window (sc_period_start/sc_period_end, inclusive). Only evaluates when
 * both the date and the full PoP range are present — missing data is flagged by other rules.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine - The budget line item.
 * @returns {boolean} - True if date_needed is outside the PoP range.
 */
export const isDateOutsidePopRange = (budgetLine) => {
    const { date_needed, sc_period_start, sc_period_end } = budgetLine ?? {};
    if (!date_needed || !sc_period_start || !sc_period_end) {
        return false;
    }
    return date_needed < sc_period_start || date_needed > sc_period_end;
};
