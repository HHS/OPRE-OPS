import { fiscalYearFromDate } from "../../../helpers/utils";

/**
 * Adds a CSS class to a table item if it is different from the original.
 * @param {boolean} isDiff - A flag indicating whether the item is different from the original.
 * @returns {string} - The CSS class to apply to the table item.
 */
export const addDiffClass = (isDiff) => {
    return isDiff ? "table-item-diff" : "";
};
/**
 * Get budget change requests
 * @param {import("../../ChangeRequests/ChangeRequestsList/ChangeRequests").ChangeRequest[]} changeRequests - The change requests
 * @returns {string[]} The budget change requests
 */
const getBudgetChangeRequests = (changeRequests) => {
    return changeRequests
        .filter((changeRequest) => changeRequest.has_budget_change)
        .flatMap((changeRequest) => Object.keys(changeRequest.requested_change_data));
};
/**
 * Get status change requests
 * @param {import("../../ChangeRequests/ChangeRequestsList/ChangeRequests").ChangeRequest[]} changeRequests - The change requests
 * @param {string} status - The status
 * @returns {string[]} The status change requests
 */
const getStatusChangeRequests = (changeRequests, status) => {
    return changeRequests
        .filter(
            (changeRequest) => changeRequest.has_status_change && changeRequest.requested_change_data.status === status
        )
        .flatMap((changeRequest) => Object.keys(changeRequest.requested_change_data));
};
/**
 * Get change request types
 * @param {boolean} isBudgetChange - Flag indicating whether the change request is a budget change
 * @param {boolean} isBLIInReview - Flag indicating whether the budget line item is in review
 * @param {Object} budgetLine - The budget line item
 * @param {boolean} isStatusChange - Flag indicating whether the change request is a status change
 * @param {string} changeRequestStatus - The change request status
 * @returns {string[]} The change request types
 */
export function getChangeRequestTypes(isBudgetChange, isBLIInReview, budgetLine, isStatusChange, changeRequestStatus) {
    /**
     * Change request types
     * @type {string[]} The change request types
     */
    if (isBudgetChange && isBLIInReview) {
        return getBudgetChangeRequests(budgetLine?.change_requests_in_review);
    }

    if (isStatusChange && isBLIInReview) {
        return getStatusChangeRequests(budgetLine?.change_requests_in_review, changeRequestStatus);
    }

    return [];
}

/**
 * Determines whether the fiscal year changes for a budget line item
 *  @param {Object} budgetLine - The budget line item
 * @returns {boolean} - A flag indicating whether the fiscal year changes
 
 */
export function doesDateNeededChangeFY(budgetLine) {
    if (!budgetLine || !budgetLine.change_requests_in_review || budgetLine.change_requests_in_review.length === 0) {
        return false;
    }

    return budgetLine.change_requests_in_review.some((changeRequest) => {
        if (!changeRequest.requested_change_diff || !changeRequest.requested_change_diff.date_needed) {
            return false;
        }

        return (
            fiscalYearFromDate(changeRequest.requested_change_diff.date_needed.old) !==
            fiscalYearFromDate(changeRequest.requested_change_diff.date_needed.new)
        );
    });
}
