import { KEY_NAMES } from "../components/ChangeRequests/ChangeRequests.constants";
import { renderField } from "./utils";
/**
 * @typedef {import('../components/BudgetLineItems/BudgetLineTypes').BudgetLine} BudgetLine
 */

/**
 * @typedef {Object} RenderedChangeValues
 * @property {string} oldValue - The old value
 * @property {string} newValue - The new value
 */

/**
 * Render change values
 * @param {string} keyName - The key name
 * @param {Object} changeTo - The requested change
 * @param {string} [oldCan] - The old CAN
 * @param {string} [newCan] - The new CAN
 *
 * @returns {RenderedChangeValues} - The rendered change values
 */
export function renderChangeValues(keyName, changeTo, oldCan = "", newCan = "") {
    let oldValue,
        newValue = "";

    switch (keyName) {
        case KEY_NAMES.AMOUNT:
            oldValue = renderField(keyName, "amount", changeTo.amount.old);
            newValue = renderField(keyName, "amount", changeTo.amount.new);
            break;
        case KEY_NAMES.CAN:
            oldValue = oldCan;
            newValue = newCan;
            break;
        case KEY_NAMES.DATE_NEEDED:
            oldValue = renderField(keyName, "date_needed", changeTo.date_needed.old);
            newValue = renderField(keyName, "date_needed", changeTo.date_needed.new);
            break;
        case KEY_NAMES.STATUS:
            oldValue = renderField(keyName, "status", changeTo.status.old);
            newValue = renderField(keyName, "status", changeTo.status.new);
            break;
        default:
            break;
    }

    return {
        oldValue,
        newValue
    };
}
/**
 * Get change requests in review from budget lines.
 * @param {BudgetLine[]} budgetLines - The budget lines.
 * @returns {Object[]} The change requests in review.
 */
export function getInReviewChangeRequests(budgetLines) {
    return budgetLines
        .filter((budgetLine) => budgetLine.in_review)
        .flatMap((budgetLine) =>
            Array.isArray(budgetLine.change_requests_in_review) ? budgetLine.change_requests_in_review : []
        );
}
