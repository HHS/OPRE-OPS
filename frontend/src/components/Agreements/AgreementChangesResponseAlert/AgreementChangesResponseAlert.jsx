import PropTypes from "prop-types";
import VanishingAlert from "../../UI/Alert/VanishingAlert";
import { renderField } from "../../../helpers/utils";


/**
 * Alert for when there are agreement changes in review.
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.changeRequests - The change requests.
 * @param {boolean} props.isApproveAlertVisible - Whether the approval alert is visible.
 * @param {boolean} props.isDeclineAlertVisible - Whether the approval alert is visible
 * @param {Function} props.setIsApproveAlertVisible - The function to set the alert visibility.
 * @param {Function} props.setIsDeclineAlertVisible - The function to set the Decline alert visibility.
 * @returns {JSX.Element} - The rendered component.
 */
function AgreementChangesResponseAlert({ changeRequests, isApproveAlertVisible, isDeclineAlertVisible, setIsApproveAlertVisible, setIsDeclineAlertVisible }) {

    const approvedRequests = changeRequests.filter((changeRequest) => {
        if(changeRequest.change_request.status === "APPROVED") {
            return changeRequest;
        }
    });

    const declinedRequests = changeRequests.filter((changeRequest) => {
        if(changeRequest.change_request.status === "REJECTED") {
            return changeRequest;
        }
    });

    const approvedRequestsReviewNotes = getChangeRequestNotes(approvedRequests);
    const declinedRequestsReviewNotes = getChangeRequestNotes(declinedRequests);
    return (
        <>
        {approvedRequests && approvedRequests.length > 0 && (
            <VanishingAlert
                type="success"
                heading="Changes Approved"
                message="Your changes have been successfully approved by your Division Director."
                setIsAlertVisible={setIsApproveAlertVisible}
                isAlertVisible={isApproveAlertVisible}
            >
                {changeRequests && changeRequests.length > 0 && (
                    <>
                        <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Changes Approved:</h2>
                        <ul className="margin-0 font-sans-sm">
                            {approvedRequests?.map((changeRequest) => (
                                <li key={changeRequest.id}>{formatChangeRequest(changeRequest.change_request)}</li>
                            ))}
                        </ul>
                        {approvedRequestsReviewNotes !== "" && (<>
                            <br/>
                            <div>
                                <strong>Notes:</strong> {approvedRequestsReviewNotes}
                            </div>
                            </>
                        )}
                    </>
                )}
            </VanishingAlert>
        )}
        {declinedRequests && declinedRequests.length > 0 && (
            <VanishingAlert
                type="error"
                heading="Changes Declined"
                message="Your changes have been declined by your Division Director."
                setIsAlertVisible={setIsDeclineAlertVisible}
                isAlertVisible={isDeclineAlertVisible}
            >
                {changeRequests && changeRequests.length > 0 && (
                    <>
                        <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Changes Declined:</h2>
                        <ul className="margin-0 font-sans-sm">
                            {
                                declinedRequests?.map((changeRequest) => (
                                    (<li key={changeRequest.id}>{formatChangeRequest(changeRequest.change_request)}</li>)
                                ))
                            }
                        </ul>
                        {declinedRequestsReviewNotes !== "" && (<>
                            <br/>
                            <div>
                                <strong>Notes:</strong> {declinedRequestsReviewNotes}
                            </div>
                            </>)}
                    </>
                )}
            </VanishingAlert>
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
    changeRequests.map((changeRequest) => {
        if(changeRequest.change_request?.reviewer_notes !== ""){
            reviewerNotes = changeRequest.change_request?.reviewer_notes;
        }
    });

    return reviewerNotes;
}

AgreementChangesResponseAlert.propTypes = {
    changeRequests: PropTypes.arrayOf(PropTypes.object),
    isApproveAlertVisible: PropTypes.bool.isRequired,
    isDeclineAlertVisible: PropTypes.bool.isRequired,
    setIsApproveAlertVisible: PropTypes.func.isRequired,
    setIsDeclineAlertVisible: PropTypes.func.isRequired,
};
export default AgreementChangesResponseAlert;
