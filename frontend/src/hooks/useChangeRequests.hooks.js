import { useGetAgreementByIdQuery, useGetCansQuery } from "../api/opsAPI";
import { renderField } from "../helpers/utils";

/**
 * Custom hook that returns the change requests for an agreement.
 * @param {number} agreementId - The id of the agreement.
 * @returns {string[]} The change requests messages.
 */
const useChangeRequests = (agreementId) => {
    const { data: agreement, isSuccess: agreementSuccess } = useGetAgreementByIdQuery(agreementId);
    const { data: cans, isSuccess: cansSuccess } = useGetCansQuery();
    const { budget_line_items: budgetLines } = agreement || {};
    if (!agreementSuccess || !cansSuccess) {
        return [];
    }
    return getChangeRequestsFromBudgetLines(budgetLines, cans);
};

/**
 * Get change requests from budget lines.
 * @param {Object[]} budgetLines - The budget lines.
 * @param {Object[]} cans - The cans.
 * @returns {string[]} The change requests messages.
 */
function getChangeRequestsFromBudgetLines(budgetLines, cans) {
    let changeRequestsMessages = new Set();
    const changeRequestsFromBudgetLines = budgetLines
        .filter((budgetLine) => budgetLine.in_review)
        .flatMap((budgetLine) =>
            Array.isArray(budgetLine.change_requests_in_review)
                ? budgetLine.change_requests_in_review.map((changeRequest) => ({ ...budgetLine, changeRequest }))
                : []
        );

    if (changeRequestsFromBudgetLines?.length > 0) {
        changeRequestsFromBudgetLines.forEach((budgetLine) => {
            budgetLine.change_requests_in_review.forEach((changeRequest) => {
                let bliId = `BL ${budgetLine.id}`;
                if (changeRequest?.requested_change_data?.amount) {
                    changeRequestsMessages.add(
                        `${bliId} Amount: ${renderField("BudgetLineItem", "amount", budgetLine?.amount)} to ${renderField("BudgetLineItem", "amount", changeRequest.requested_change_data.amount)}`
                    );
                }
                if (changeRequest?.requested_change_data?.date_needed) {
                    changeRequestsMessages.add(
                        `${bliId} Date Needed:  ${renderField("BudgetLine", "date_needed", budgetLine?.date_needed)} to ${renderField("BudgetLine", "date_needed", changeRequest.requested_change_data.date_needed)}`
                    );
                }
                if (changeRequest?.requested_change_data?.can_id) {
                    let matchingCan = cans?.find((can) => can.id === changeRequest.requested_change_data.can_id);
                    let canName = matchingCan?.display_name || "TBD";

                    changeRequestsMessages.add(`${bliId} CAN: ${budgetLine.can.display_name} to ${canName}`);
                }
            });
        });
    }
    return Array.from(changeRequestsMessages);
}

export default useChangeRequests;
