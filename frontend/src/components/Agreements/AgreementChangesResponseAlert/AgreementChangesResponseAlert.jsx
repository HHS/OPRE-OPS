import PropTypes from "prop-types";
import { useDismissNotificationMutation } from "../../../api/opsAPI";
import { renderField } from "../../../helpers/utils";
import SimpleAlert from "../../UI/Alert/SimpleAlert";



/**
 * Alert for when there are agreement changes in review.
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.changeRequestNotifications - The notifications for change requests for a given agreement
 * @param {boolean} props.isApproveAlertVisible - Whether the approval alert is visible.
 * @param {boolean} props.isDeclineAlertVisible - Whether the approval alert is visible
 * @param {Function} props.setIsApproveAlertVisible - The function to set the alert visibility.
 * @param {Function} props.setIsDeclineAlertVisible - The function to set the Decline alert visibility.
 * @returns {JSX.Element} - The rendered component.
 */
function AgreementChangesResponseAlert({ changeRequestNotifications, isApproveAlertVisible, isDeclineAlertVisible, setIsApproveAlertVisible, setIsDeclineAlertVisible }) {

    const [dismissNotification] = useDismissNotificationMutation();
    const approvedRequests = changeRequestNotifications?.filter(request => request.change_request.status === "APPROVED");
    const declinedRequests = changeRequestNotifications?.filter(request => request.change_request.status === "REJECTED");

    const approveRequestIds = approvedRequests?.map(request => request.id);
    const declineRequestIds = declinedRequests?.map(request => request.id);
    const approvedRequestsReviewNotes = getChangeRequestNotes(approvedRequests);
    const declinedRequestsReviewNotes = getChangeRequestNotes(declinedRequests);
    const setApproveAlertVisibleAndDismissRequest = (approveAlertStatus) => {
        approveRequestIds?.forEach((requestId) => {dismissNotification(requestId)})
        setIsApproveAlertVisible(approveAlertStatus);
    }
    const setDeclineAlertVisibleAndDismissRequest = (declineAlertStatus) => {
        declineRequestIds?.forEach((requestId) => {dismissNotification(requestId)})
        setIsDeclineAlertVisible(declineAlertStatus);
    }
    return (
        <>
        {approvedRequests && approvedRequests.length > 0 && (
            <SimpleAlert
                type="success"
                heading="Changes Approved"
                message="Your changes have been successfully approved by your Division Director."
                setIsAlertVisible={setApproveAlertVisibleAndDismissRequest}
                isAlertVisible={isApproveAlertVisible}
                isClosable={true}
            >
                {changeRequestNotifications?.length > 0 && (
                    <>
                        <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Changes Approved:</h2>
                        <ul className="margin-0 font-sans-sm">
                            {approvedRequests?.map((changeRequest) => (
                                <li key={changeRequest.id}>{formatChangeRequest(changeRequest.change_request)}</li>
                            ))}
                        </ul>
                        {approvedRequestsReviewNotes && approvedRequestsReviewNotes !== "" && (<>
                            <br/>
                            <div>
                                <strong>Notes:</strong> {approvedRequestsReviewNotes}
                            </div>
                            </>
                        )}
                    </>
                )}
            </SimpleAlert>
        )}
        {declinedRequests?.length > 0 && (
            <SimpleAlert
                type="error"
                heading="Changes Declined"
                message="Your changes have been declined by your Division Director."
                setIsAlertVisible={setDeclineAlertVisibleAndDismissRequest}
                isAlertVisible={isDeclineAlertVisible}
                isClosable={true}
            >
                {changeRequestNotifications && changeRequestNotifications.length > 0 && (
                    <>
                        <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Changes Declined:</h2>
                        <ul className="margin-0 font-sans-sm">
                            {
                                declinedRequests?.map((changeRequest) => (
                                    (<li key={changeRequest.id}>{formatChangeRequest(changeRequest.change_request)}</li>)
                                ))
                            }
                        </ul>
                        {declinedRequestsReviewNotes && declinedRequestsReviewNotes !== "" && (<>
                            <br/>
                            <div>
                                <strong>Notes:</strong> {declinedRequestsReviewNotes}
                            </div>
                            </>)}
                    </>
                )}
            </SimpleAlert>
        )}
        </>
    );
}

function formatChangeRequest(changeRequest) {
    let bliId = `BL ${changeRequest.budget_line_item_id}`;
    if (changeRequest?.requested_change_diff?.amount) {
        return `${bliId} Amount: ${renderField("BudgetLineItem", "amount", changeRequest.requested_change_diff.amount.old)} to ${renderField("BudgetLineItem", "amount", changeRequest.requested_change_diff.amount.new)}`;
    }
    if (changeRequest?.requested_change_diff?.date_needed) {
        return `${bliId} Date Needed:  ${renderField("BudgetLine", "date_needed", changeRequest.requested_change_diff.date_needed.old)} to ${renderField("BudgetLine", "date_needed", changeRequest.requested_change_diff.date_needed.new)}`;
    }
    if (changeRequest?.requested_change_diff?.can_id) {
        return `${bliId} CAN: ${changeRequest.requested_change_diff.can_id.old} to ${changeRequest.requested_change_diff.can_id.new}`;
    }
    if (changeRequest?.requested_change_diff?.status) {
        return `${bliId} Status: ${renderField("BudgetLine", "status", changeRequest.requested_change_diff.status.old)} to ${renderField("BudgetLine", "status", changeRequest.requested_change_diff.status.new)}`;
    }

    return "";
}

/**
 * This function retrieves the notes about an approval or denial of a set of changes to budget lines. It assumes you are passing only the list of approved or denied changes,
 * and not a mixed list of both.
 * @param {Object[]} changeRequests
 */
function getChangeRequestNotes(changeRequests) {
    let reviewerNotes = "";
    changeRequests?.map((changeRequest) => {
        if(changeRequest.change_request?.reviewer_notes !== ""){
            reviewerNotes = changeRequest.change_request?.reviewer_notes;
        }
    });

    return reviewerNotes;
}

AgreementChangesResponseAlert.propTypes = {
    changeRequestNotifications: PropTypes.arrayOf(PropTypes.object),
    isApproveAlertVisible: PropTypes.bool.isRequired,
    isDeclineAlertVisible: PropTypes.bool.isRequired,
    setIsApproveAlertVisible: PropTypes.func.isRequired,
    setIsDeclineAlertVisible: PropTypes.func.isRequired,
};
export default AgreementChangesResponseAlert;
