import { useSelector } from "react-redux";
import { BLI_STATUS } from "../helpers/budgetLines.helpers";

/**
 * @typedef {Object} BudgetLine
 * @property {number} id - The ID of the budget line.
 * @property {string} status - The status of the budget line.
 * @property {number} created_by - The ID of the user who created the budget line.
 * @property {boolean} in_review - Whether the budget line is in review.
 */

/**
 * This hook returns true if the budget line is in a status that is editable.
 * @param {BudgetLine} budgetLine - The budget line object.
 * @returns {boolean} - Whether the budget line is in a status that is editable.
 * @example
 * const isBudgetLineInEditableStatus = useIsBudgetLineEditableByStatus(budgetLine);
 */
export const useIsBudgetLineEditableByStatus = (budgetLine) => {
    const isBudgetLineDraft = budgetLine?.status === BLI_STATUS.DRAFT;
    const isBudgetLinePlanned = budgetLine?.status === BLI_STATUS.PLANNED;
    const isBudgetLineExecuting = budgetLine?.status === BLI_STATUS.EXECUTING;
    const isBudgetLineInReview = budgetLine?.in_review;
    const isBudgetLineInEditableStatus =
        (isBudgetLineDraft || isBudgetLinePlanned || isBudgetLineExecuting) && !isBudgetLineInReview;

    return isBudgetLineInEditableStatus;
};

/**
 * This hook returns true if the logged in user is the creator of the budget line.
 * @param {BudgetLine} budgetLine - The budget line object.
 * @returns {boolean} - Whether the logged in user is the creator of the budget line.
 * @example
 * const isUserBudgetLineCreator = useIsBudgetLineCreator(budgetLine);
 */
export const useIsBudgetLineCreator = (/** @type {BudgetLine} */ budgetLine) => {
    const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);
    const isUserBudgetLineCreator = budgetLine?.created_by === loggedInUserId;

    return isUserBudgetLineCreator;
};
