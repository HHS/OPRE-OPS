import { useDismissNotificationMutation, useGetProcurementShopByIdQuery } from "../../../api/opsAPI";
import { calculateTotal } from "../../../helpers/agreement.helpers";
import { convertToCurrency, renderField } from "../../../helpers/utils";

/**
 * @param {Object[]} changeRequestNotifications
 * @param {Function} setIsApproveAlertVisible
 * @param {Function} setIsDeclineAlertVisible
 */

const useAgreementChangesResponseAlert = (
    changeRequestNotifications,
    setIsApproveAlertVisible,
    setIsDeclineAlertVisible
) => {
    const [dismissNotification] = useDismissNotificationMutation();

    let newAwardingEntityId = -1;
    let oldAwardingEntityId = -1;
    const approvedRequests = changeRequestNotifications?.filter(
        (request) => request.change_request.status === "APPROVED"
    );
    const declinedRequests = changeRequestNotifications?.filter(
        (request) => request.change_request.status === "REJECTED"
    );

    const procurementShopChangeNotification = changeRequestNotifications.find(
        (notification) => notification.change_request?.requested_change_diff?.awarding_entity_id !== undefined
    );

    if (procurementShopChangeNotification) {
        newAwardingEntityId =
            procurementShopChangeNotification?.change_request?.requested_change_diff?.awarding_entity_id?.new;
        oldAwardingEntityId =
            procurementShopChangeNotification?.change_request?.requested_change_diff?.awarding_entity_id?.old;
    }

    /** @type {{data?: import("../../../types/AgreementTypes").ProcurementShop | undefined}} */
    const { data: oldProcurementShop, isLoading: oldProcurementShopIsLoading } = useGetProcurementShopByIdQuery(
        oldAwardingEntityId,
        {
            skip: !procurementShopChangeNotification
        }
    );

    /** @type {{data?: import("../../../types/AgreementTypes").ProcurementShop | undefined}} */
    const { data: newProcurementShop, isLoading: newProcurementShopIsLoading } = useGetProcurementShopByIdQuery(
        newAwardingEntityId,
        {
            skip: !procurementShopChangeNotification
        }
    );

    const approveRequestIds = approvedRequests?.map((request) => request.id);
    const declineRequestIds = declinedRequests?.map((request) => request.id);
    const approvedRequestsReviewNotes = getChangeRequestNotes(approvedRequests);
    const declinedRequestsReviewNotes = getChangeRequestNotes(declinedRequests);
    const setApproveAlertVisibleAndDismissRequest = (approveAlertStatus) => {
        approveRequestIds?.forEach((requestId) => {
            dismissNotification(requestId);
        });
        setIsApproveAlertVisible(approveAlertStatus);
    };
    const setDeclineAlertVisibleAndDismissRequest = (declineAlertStatus) => {
        declineRequestIds?.forEach((requestId) => {
            dismissNotification(requestId);
        });
        setIsDeclineAlertVisible(declineAlertStatus);
    };

    return {
        approvedRequests,
        declinedRequests,
        oldProcurementShop,
        newProcurementShop,
        oldProcurementShopIsLoading,
        newProcurementShopIsLoading,
        approvedRequestsReviewNotes,
        declinedRequestsReviewNotes,
        setApproveAlertVisibleAndDismissRequest,
        setDeclineAlertVisibleAndDismissRequest
    };
};
export function formatChangeRequest(changeRequest, oldProcurementShop = {}, newProcurementShop = {}, budgetLines = []) {
    let bliId = `BL ${changeRequest.budget_line_item_id}`;
    if (changeRequest?.requested_change_diff?.amount) {
        return (
            <li>
                ${bliId} Amount: $
                {renderField("BudgetLineItem", "amount", changeRequest.requested_change_diff.amount.old)} to $
                {renderField("BudgetLineItem", "amount", changeRequest.requested_change_diff.amount.new)}
            </li>
        );
    }
    if (changeRequest?.requested_change_diff?.date_needed) {
        return (
            <li>
                ${bliId} Date Needed: $
                {renderField("BudgetLine", "date_needed", changeRequest.requested_change_diff.date_needed.old)} to $
                {renderField("BudgetLine", "date_needed", changeRequest.requested_change_diff.date_needed.new)}
            </li>
        );
    }
    if (changeRequest?.requested_change_diff?.can_id) {
        return (
            <li>
                ${bliId} CAN: ${changeRequest.requested_change_diff.can_id.old} to $
                {changeRequest.requested_change_diff.can_id.new}
            </li>
        );
    }
    if (changeRequest?.requested_change_diff?.status) {
        return (
            <li>
                ${bliId} Status: ${renderField("BudgetLine", "status", changeRequest.requested_change_diff.status.old)}{" "}
                to ${renderField("BudgetLine", "status", changeRequest.requested_change_diff.status.new)}
            </li>
        );
    }
    if (changeRequest.change_request_type === "AGREEMENT_CHANGE_REQUEST" && oldProcurementShop && newProcurementShop) {
        const newTotal = calculateTotal(budgetLines ?? [], (newProcurementShop?.fee_percentage ?? 0) / 100);
        const oldTotal = calculateTotal(budgetLines ?? [], (oldProcurementShop?.fee_percentage ?? 0) / 100);
        const procurementShopNameChange = `Procurement Shop: ${oldProcurementShop?.name} (${oldProcurementShop?.abbr}) to ${newProcurementShop?.name} (${newProcurementShop?.abbr})`;
        const procurementFeePercentageChange = `Fee Rate: ${oldProcurementShop?.fee_percentage}% to ${newProcurementShop?.fee_percentage}%`;
        const procurementShopFeeTotalChange = `Fee Total: ${convertToCurrency(oldTotal)} to ${convertToCurrency(newTotal)}`;
        return (
            <>
                <li>{procurementShopNameChange}</li>
                <li>{procurementFeePercentageChange}</li>
                <li>{procurementShopFeeTotalChange}</li>
            </>
        );
    }

    return "";
}

/**
 * This function retrieves the notes about an approval or denial of a set of changes to budget lines. It assumes you are passing only the list of approved or denied changes,
 * and not a mixed list of both.
 * @param {Object[]} changeRequests
 */
export function getChangeRequestNotes(changeRequests) {
    let reviewerNotes = "";
    changeRequests?.map((changeRequest) => {
        if (changeRequest.change_request?.reviewer_notes !== "") {
            reviewerNotes = changeRequest.change_request?.reviewer_notes;
        }
    });

    return reviewerNotes;
}

export default useAgreementChangesResponseAlert;
