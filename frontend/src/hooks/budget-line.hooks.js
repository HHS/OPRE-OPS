import { useSelector } from "react-redux";

/**
 * @typedef {Object} BudgetLine
 * @property {number} id - The ID of the budget line.
 * @property {string} status - The status of the budget line.
 * @property {number} created_by - The ID of the user who created the budget line.
 * @property {boolean} in_review - Whether the budget line is in review.
 */

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
