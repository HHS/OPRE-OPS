import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";
import { renderField } from "../../../helpers/utils";


/**
 * Alert for when there are agreement changes in review.
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.changeRequests - The change requests.
 * @param {boolean} props.isAlertVisible - Whether the alert is visible.
 * @param {Function} props.setIsAlertVisible - The function to set the alert visibility.
 * @returns {JSX.Element} - The rendered component.
 */
function AgreementChangesResponseAlert({ changeRequests, isAlertVisible, setIsAlertVisible }) {
    console.log(changeRequests);
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

    const declinedRequestsReviewNotes = getChangeRequestNotes(declinedRequests);
    return (
        <>
        {approvedRequests && approvedRequests.length > 0 && (
            <SimpleAlert
                type="success"
                heading="Changes Approved"
                message="Your changes have been successfully approved by your Division Director."
                isClosable={true}
                setIsAlertVisible={setIsAlertVisible}
                isAlertVisible={isAlertVisible}
            >
                {changeRequests && changeRequests.length > 0 && (
                    <>
                        <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Changes Approved:</h2>
                        <ul className="margin-0 font-sans-sm">
                            {approvedRequests?.map((changeRequest) => (
                                <li key={changeRequest.id}>{changeRequest.message}</li>
                            ))}
                        </ul>
                    </>
                )}
            </SimpleAlert>
        )}
        {declinedRequests && declinedRequests.length > 0 && (
            <SimpleAlert
                type="error"
                heading="Changes Declined"
                message="Your changes have been declined by your Division Director."
                isClosable={true}
                setIsAlertVisible={setIsAlertVisible}
                isAlertVisible={isAlertVisible}
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
    changeRequests.map((changeRequest) => {
        if(changeRequest.change_request?.reviewer_notes !== ""){
            reviewerNotes = changeRequest.change_request?.reviewer_notes;
        }
    });

    return reviewerNotes;
}

AgreementChangesResponseAlert.propTypes = {
    changeRequests: PropTypes.arrayOf(PropTypes.object),
    isAlertVisible: PropTypes.bool.isRequired,
    setIsAlertVisible: PropTypes.func.isRequired
};
export default AgreementChangesResponseAlert;
