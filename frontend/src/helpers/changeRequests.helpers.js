import { KEY_NAMES } from "../components/ChangeRequests/ChangeRequests.constants";
import { calculateTotal } from "./agreement.helpers";
import { convertToCurrency, renderField } from "./utils";
/**
 * @typedef {import('../types/BudgetLineTypes').BudgetLine} BudgetLine
 * @typedef {import('../types/ChangeRequestsTypes').ChangeRequest} ChangeRequest
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
 * @param {number}[ userId] - The user division ID.
 * @returns {ChangeRequest[]} The change requests in review.
 */

export function getInReviewChangeRequests(budgetLines, userId) {
    return budgetLines
        .filter(
            (budgetLine) =>
                budgetLine.in_review &&
                (!userId ||
                    budgetLine.can?.portfolio?.division.division_director_id === userId ||
                    budgetLine.can?.portfolio?.division.deputy_division_director_id === userId)
        )
        .flatMap((budgetLine) => budgetLine.change_requests_in_review || []);
}

/**
 * Custom hook that returns the change requests message for procurement shop.
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} budgetLines - The agreement data.
 * @param {import("../types/AgreementTypes").ProcurementShop} oldAwardingEntity - The old awarding entity.
 * @param {import("../types/AgreementTypes").ProcurementShop} newAwardingEntity - The new awarding entity.
 * @returns {string} The change requests messages.
 */
export const getChangeRequestMessages = (budgetLines, oldAwardingEntity, newAwardingEntity) => {
    if (!budgetLines || !oldAwardingEntity || !newAwardingEntity) {
        return "";
    }

    const oldTotal = calculateTotal(budgetLines ?? [], (oldAwardingEntity?.fee_percentage ?? 0) / 100);

    const newTotal = calculateTotal(budgetLines ?? [], (newAwardingEntity?.fee_percentage ?? 0) / 100);

    const procurementShopNameChange = `Procurement Shop: ${oldAwardingEntity?.abbr} to ${newAwardingEntity?.abbr}`;
    const procurementFeePercentageChange = `Fee Rate: ${oldAwardingEntity?.fee_percentage}% to ${newAwardingEntity?.fee_percentage}%`;
    const procurementShopFeeTotalChange = `Fee Total: ${convertToCurrency(oldTotal)} to ${convertToCurrency(newTotal)}`;

    return `${procurementShopNameChange}\n${procurementFeePercentageChange}\n${procurementShopFeeTotalChange}`;
};

/**
 * Check if the procurement shop has changed in the budget line.
 * @param {import("../types/BudgetLineTypes").BudgetLine} budgetLine - The budget line to check.
 * @returns {boolean} True if the procurement shop has changed, false otherwise.
 */
export const hasProcurementShopChange = (budgetLine) => {
    if (!budgetLine || !budgetLine.change_requests_in_review) {
        return false;
    }

    return budgetLine?.change_requests_in_review?.some(
        (changeRequest) => changeRequest?.requested_change_data?.awarding_entity_id
    );
};
