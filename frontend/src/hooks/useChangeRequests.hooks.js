import { useSelector } from "react-redux";
import { useGetAgreementByIdQuery, useGetCansQuery, useGetChangeRequestsListQuery } from "../api/opsAPI";
import { renderField } from "../helpers/utils";
/**
 * @typedef {import ('../types/ChangeRequestsTypes').ChangeRequest} ChangeRequest
 * @typedef {import ('../types/BudgetLineTypes').BudgetLine} BudgetLine
 * @typedef {import ('../types/CANTypes').CAN} CAN
 */

/**
 * Custom hook that returns the change requests for an agreement.
 * @param {number} agreementId - The id of the agreement.
 * @returns {string[]} The change requests messages.
 */
export const useChangeRequestsForAgreement = (agreementId) => {
    const { data: agreement, isSuccess: agreementSuccess } = useGetAgreementByIdQuery(agreementId);
    const { data: cans, isSuccess: cansSuccess } = useGetCansQuery({});
    const { budget_line_items: budgetLines } = agreement || {};
    if (!agreementSuccess || !cansSuccess) {
        return [];
    }
    return getChangeRequestsFromBudgetLines(budgetLines, cans);
};

/**
 * Custom hook that returns the total number of change requests.
 * @returns {number} The total number of change requests.
 */
export const useChangeRequestTotal = () => {
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    const { data: changeRequests } = useGetChangeRequestsListQuery({ userId });

    return changeRequests?.length || 0;
};

/**
 * Custom hook that returns the change requests for budget lines.
 * @param {BudgetLine[]} budgetLines - The budget lines.
 * @param {string | null} targetStatus - The target status to filter change requests.
 * @param {boolean} [isBudgetChange] - Whether to filter for budget changes.
 *
 * @returns {string} The change requests messages.
 */
export const useChangeRequestsForBudgetLines = (budgetLines, targetStatus, isBudgetChange = false) => {
    const { data: cans, isSuccess: cansSuccess } = useGetCansQuery({});

    if (!budgetLines || !cansSuccess) {
        return "";
    }

    let messages;
    if (isBudgetChange) {
        messages = getFilteredChangeRequestsFromBudgetLines(budgetLines, cans, null, true);
    } else if (targetStatus) {
        messages = getFilteredChangeRequestsFromBudgetLines(budgetLines, cans, targetStatus, false);
    } else {
        messages = getChangeRequestsFromBudgetLines(budgetLines, cans);
    }

    const formattedMessages = formatMessage(messages);
    return formattedMessages;
};

/**
 * Custom hook that returns the change requests for a budget line.
 * @param {BudgetLine} budgetLine - The budget line.
 * @param {string} [title] - The title of message
 * @returns {string} The change requests messages.
 */
export const useChangeRequestsForTooltip = (budgetLine, title) => {
    const { data: cans, isSuccess: cansSuccess } = useGetCansQuery({});
    const { change_requests_in_review: changeRequests, in_review: isBLIInReview } = budgetLine || {};
    if (!cansSuccess) {
        return "";
    }
    return getChangeRequestsForTooltip(changeRequests, budgetLine, cans, cansSuccess, isBLIInReview, title);
};

/**
 * Get change requests for tooltip.
 * @param {ChangeRequest[]} changeRequests - The change requests.
 * @param {BudgetLine} budgetLine - The budget line.
 * @param {CAN[]} cans - The cans.
 * @param {boolean} cansSuccess - Whether the cans were successfully fetched.
 * @param {boolean} isBLIInReview - Whether the budget line is in review.
 * @param {string} [title] - The title of message
 * @returns {string} The change requests messages.
 */
export function getChangeRequestsForTooltip(changeRequests, budgetLine, cans, cansSuccess, isBLIInReview, title) {
    /**
     * @type {string[]}
     */
    let changeRequestsMessages = [];

    if (changeRequests?.length > 0 && cansSuccess) {
        changeRequests.forEach((changeRequest) => {
            if (changeRequest?.requested_change_data?.amount) {
                changeRequestsMessages.push(
                    `Amount: ${renderField("ContractBudgetLineItem", "amount", budgetLine?.amount)} to ${renderField("BudgetLineItem", "amount", changeRequest.requested_change_data.amount)}`
                );
            }
            if (changeRequest?.requested_change_data?.date_needed) {
                changeRequestsMessages.push(
                    `Obligate By Date:  ${renderField("BudgetLine", "date_needed", budgetLine?.date_needed)} to ${renderField("BudgetLine", "date_needed", changeRequest.requested_change_data.date_needed)}`
                );
            }
            if (changeRequest?.requested_change_data?.can_id) {
                let matchingCan = cans.find((can) => can.id === changeRequest.requested_change_data.can_id);
                let canName = matchingCan?.display_name || "TBD";

                changeRequestsMessages.push(`CAN: ${budgetLine.can?.display_name} to ${canName}`);
            }
            if (changeRequest?.requested_change_data?.status) {
                changeRequestsMessages.push(
                    `Status Change: ${renderField("BudgetLine", "status", budgetLine.status)} to ${renderField("BudgetLine", "status", changeRequest.requested_change_data.status)}`
                );
            }

            return changeRequestsMessages;
        });
    }

    let lockedMessage = "";

    if (isBLIInReview) {
        lockedMessage = `${title ? title : "This budget line has pending edits:"}`;
        changeRequestsMessages.forEach((message) => {
            lockedMessage += `\n \u2022 ${message}`;
        });
    }
    return lockedMessage;
}

/**
 * Get change requests from budget lines.
 * @param {BudgetLine[]} budgetLines - The budget lines.
 * @param {CAN[]} cans - The cans.
 *
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
            budgetLine.change_requests_in_review?.forEach(
                /** @param {ChangeRequest} changeRequest*/
                (changeRequest) => {
                    let bliId = `BL ${budgetLine.id}`;
                    if (changeRequest?.requested_change_data?.amount) {
                        changeRequestsMessages.add(
                            `${bliId} Amount: ${renderField("ContractBudgetLineItem", "amount", budgetLine?.amount)} to ${renderField("BudgetLineItem", "amount", changeRequest.requested_change_data.amount)}`
                        );
                    }
                    if (changeRequest?.requested_change_data?.date_needed) {
                        changeRequestsMessages.add(
                            `${bliId} Obligate By Date:  ${renderField("BudgetLine", "date_needed", budgetLine?.date_needed)} to ${renderField("BudgetLine", "date_needed", changeRequest.requested_change_data.date_needed)}`
                        );
                    }
                    if (changeRequest?.requested_change_data?.can_id) {
                        let matchingCan = cans?.find((can) => can.id === changeRequest.requested_change_data.can_id);
                        let canName = matchingCan?.display_name || "TBD";

                        changeRequestsMessages.add(`${bliId} CAN: ${budgetLine.can?.display_name} to ${canName}`);
                    }
                    if (changeRequest?.requested_change_data?.status) {
                        changeRequestsMessages.add(
                            `${bliId} Status: ${renderField("BudgetLine", "status", budgetLine.status)} to ${renderField("BudgetLine", "status", changeRequest.requested_change_data.status)}`
                        );
                    }
                }
            );
        });
    }
    return Array.from(changeRequestsMessages);
}

/**
 * Get filtered change requests from budget lines.
 * @param {BudgetLine[]} budgetLines - The budget lines.
 * @param {CAN[]} cans - The cans.
 * @param {string | null} [targetStatus] - The target status to filter change requests.
 * @param {boolean} [isBudgetChange] - Whether to filter for budget changes.
 * @returns {string[]} The change requests messages.
 */
function getFilteredChangeRequestsFromBudgetLines(budgetLines, cans, targetStatus, isBudgetChange = false) {
    let changeRequestsMessages = new Set();
    const changeRequestsFromBudgetLines = budgetLines
        .filter((budgetLine) => budgetLine.in_review)
        .flatMap((budgetLine) =>
            Array.isArray(budgetLine.change_requests_in_review)
                ? budgetLine.change_requests_in_review
                      .filter(
                          (cr) =>
                              (isBudgetChange && cr.has_budget_change) ||
                              (!isBudgetChange && cr.requested_change_data.status === targetStatus)
                      )
                      .map((changeRequest) => ({ ...budgetLine, changeRequest }))
                : []
        );

    if (changeRequestsFromBudgetLines?.length > 0) {
        changeRequestsFromBudgetLines.forEach((budgetLine) => {
            let bliId = `BL ${budgetLine.id}`;
            const changeRequest = budgetLine.changeRequest;

            if (isBudgetChange) {
                if (changeRequest?.requested_change_data?.amount) {
                    changeRequestsMessages.add(
                        `${bliId} Amount: ${renderField("ContractBudgetLineItem", "amount", budgetLine?.amount)} to ${renderField("BudgetLineItem", "amount", changeRequest.requested_change_data.amount)}`
                    );
                }
                if (changeRequest?.requested_change_data?.date_needed) {
                    changeRequestsMessages.add(
                        `${bliId} Obligate By Date: ${renderField("BudgetLine", "date_needed", budgetLine?.date_needed)} to ${renderField("BudgetLine", "date_needed", changeRequest.requested_change_data.date_needed)}`
                    );
                }
                if (changeRequest?.requested_change_data?.can_id) {
                    let matchingCan = cans?.find((can) => can.id === changeRequest.requested_change_data.can_id);
                    let canName = matchingCan?.display_name || "TBD";
                    changeRequestsMessages.add(`${bliId} CAN: ${budgetLine.can?.display_name} to ${canName}`);
                }
            }
            if (!isBudgetChange) {
                if (changeRequest?.requested_change_data?.status) {
                    changeRequestsMessages.add(
                        `${bliId} Status: ${renderField("BudgetLine", "status", budgetLine.status)} to ${renderField("BudgetLine", "status", changeRequest.requested_change_data.status)}`
                    );
                }
            }
        });
    }
    return Array.from(changeRequestsMessages);
}
/**
 * Format the message.
 * @param {string[]} changeRequestsMessages - The change requests messages.
 * @returns {string} The formatted message.
 */
function formatMessage(changeRequestsMessages) {
    return Array.from(changeRequestsMessages)
        .map((message) => ` \u2022 ${message}`)
        .join("\n");
}
