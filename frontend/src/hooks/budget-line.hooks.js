import { useSelector } from "react-redux";
import { useAddBudgetLineItemMutation, useUpdateBudgetLineItemMutation } from "../api/opsAPI";
import useAlert from "./use-alert.hooks";
import { cleanBudgetLineItemForApi } from "../helpers/budgetLines.helpers";

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

const useSaveBudgetLines = (tempBudgetLines) => {
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const { setAlert } = useAlert();

    const saveBudgetLines = async () => {
        try {
            const promises = tempBudgetLines.map((budgetLine) => {
                const { id, data } = cleanBudgetLineItemForApi(budgetLine);
                if (id) {
                    return updateBudgetLineItem({ id, data }).unwrap();
                } else {
                    return addBudgetLineItem(data).unwrap();
                }
            });

            await Promise.all(promises);
            setAlert({
                type: "success",
                heading: "Budget Lines Saved",
                message: "All budget lines have been successfully saved."
            });
        } catch (error) {
            console.error(`SAVE: budget lines failed: ${JSON.stringify(error, null, 2)}`);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while saving the budget lines.",
                redirectUrl: "/error"
            });
        }
    };

    return { saveBudgetLines };
};

export default useSaveBudgetLines;
