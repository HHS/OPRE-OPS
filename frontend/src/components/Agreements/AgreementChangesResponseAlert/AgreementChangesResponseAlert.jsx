import SimpleAlert from "../../UI/Alert/SimpleAlert";
import React from "react";
import useAgreementChangesResponseAlert, { formatChangeRequest } from "./AgreementChangesResponseAlert.hooks";

/**
 * Alert for when there are agreement changes in review.
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.changeRequestNotifications - The notifications for change requests for a given agreement
 * @param {boolean} props.isApproveAlertVisible - Whether the approval alert is visible.
 * @param {boolean} props.isDeclineAlertVisible - Whether the approval alert is visible
 * @param {Function} props.setIsApproveAlertVisible - The function to set the alert visibility.
 * @param {Function} props.setIsDeclineAlertVisible - The function to set the Decline alert visibility.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} props.budgetLines - The agreement budget lines items.
 * @returns {React.ReactElement} - The rendered component.
 */
function AgreementChangesResponseAlert({
    changeRequestNotifications,
    isApproveAlertVisible,
    isDeclineAlertVisible,
    setIsApproveAlertVisible,
    setIsDeclineAlertVisible,
    budgetLines
}) {
    const {
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
    } = useAgreementChangesResponseAlert(
        changeRequestNotifications,
        setIsApproveAlertVisible,
        setIsDeclineAlertVisible
    );

    if (oldProcurementShopIsLoading || newProcurementShopIsLoading) {
        return <h1>Loading...</h1>;
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
                                    <React.Fragment key={changeRequest.id}>
                                        {formatChangeRequest(
                                            changeRequest.change_request,
                                            oldProcurementShop,
                                            newProcurementShop,
                                            budgetLines
                                        )}
                                    </React.Fragment>
                                ))}
                            </ul>
                            {approvedRequestsReviewNotes && approvedRequestsReviewNotes !== "" && (
                                <>
                                    <br />
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
                                {declinedRequests?.map((changeRequest) => (
                                    <React.Fragment key={changeRequest.id}>
                                        {formatChangeRequest(
                                            changeRequest.change_request,
                                            oldProcurementShop,
                                            newProcurementShop,
                                            budgetLines
                                        )}
                                    </React.Fragment>
                                ))}
                            </ul>
                            {declinedRequestsReviewNotes && declinedRequestsReviewNotes !== "" && (
                                <>
                                    <br />
                                    <div>
                                        <strong>Notes:</strong> {declinedRequestsReviewNotes}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </SimpleAlert>
            )}
        </>
    );
}

export default AgreementChangesResponseAlert;
