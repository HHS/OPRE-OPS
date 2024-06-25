import * as React from "react";
import { useReviewChangeRequestMutation } from "../../api/opsAPI";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";
import useAlert from "../../hooks/use-alert.hooks";
import { CHANGE_REQUEST_ACTION, CHANGE_REQUEST_TYPES } from "./ChangeRequests.constants";

const useChangeRequest = () => {
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        handleConfirm: () => {}
    });
    const [reviewCR] = useReviewChangeRequestMutation();
    const { setAlert } = useAlert();
    /**
     * @typedef {Object} reviewData
     * @property {string} agreementName - The name of the agreement.
     * @property {string} type - The type of the change request.
     * @property {string} bliToStatus - The status of the budget line item after the change.
     */
    /**
     * @param {number} id - The ID of the change request.
     * @param {string} action - The action to be performed. Either "APPROVE" or "REJECT".
     * @param {string} notes - The reviewer notes.
     * @param {reviewData} reviewData - The data to be reviewed.
     * @returns {void} - The result of the mutation.
     */
    const handleReviewChangeRequest = (id, action, notes, reviewData) => {
        const { agreementName, type, bliToStatus } = reviewData;
        const bliStatusExecuting = bliToStatus === "Executing" ? BLI_STATUS.EXECUTING : "";
        const payload = {
            change_request_id: id,
            action,
            reviewer_notes: notes
        };
        const BUDGET_APPROVE = action === CHANGE_REQUEST_ACTION.APPROVE && type === CHANGE_REQUEST_TYPES.BUDGET;
        const BUDGET_REJECT = action === CHANGE_REQUEST_ACTION.REJECT && type === CHANGE_REQUEST_TYPES.BUDGET;
        const PLANNED_STATUS_APPROVE =
            bliToStatus.toUpperCase() === BLI_STATUS.PLANNED &&
            action === CHANGE_REQUEST_ACTION.APPROVE &&
            type === CHANGE_REQUEST_TYPES.STATUS;
        const PLANNED_STATUS_REJECT =
            bliToStatus.toUpperCase() === BLI_STATUS.PLANNED &&
            action === CHANGE_REQUEST_ACTION.REJECT &&
            type === CHANGE_REQUEST_TYPES.STATUS;
        const EXECUTING_STATUS_APPROVE =
            bliStatusExecuting === BLI_STATUS.EXECUTING &&
            action === CHANGE_REQUEST_ACTION.APPROVE &&
            type === CHANGE_REQUEST_TYPES.STATUS;
        const EXECUTING_STATUS_REJECT =
            bliStatusExecuting === BLI_STATUS.EXECUTING &&
            action === CHANGE_REQUEST_ACTION.REJECT &&
            type === CHANGE_REQUEST_TYPES.STATUS;
        let heading,
            btnText,
            alertType,
            alertHeading,
            alertMsg = "";

        if (BUDGET_APPROVE) {
            heading = `Are you sure you want to approve this ${type.toLowerCase()}? The agreement will be updated after your approval.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = `${type} Approved`;
            alertMsg = `The agreement ${agreementName} has been successfully updated.`;
        }
        if (BUDGET_REJECT) {
            heading = `Are you sure you want to decline this ${type.toLowerCase()}? The agreement will remain the same as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = `${type} Declined`;
            alertMsg = `The agreement ${agreementName} will not be updated with the requested change(s). It will remain as it was before any changes were requested.`;
        }
        if (PLANNED_STATUS_APPROVE) {
            heading = `Are you sure you want to approve these budget lines for ${bliToStatus} Status? This will subtract the amounts from the FY budget.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = `Budget Lines Approved for ${bliToStatus} Status`;
            alertMsg = `Budget lines for Agreement ${agreementName} have been successfully approved for ${bliToStatus} Status.`;
        }
        if (PLANNED_STATUS_REJECT) {
            heading = `Are you sure you want to decline these budget lines for ${bliToStatus} Status?`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = `Budget Lines Declined for ${bliToStatus} Status`;
            alertMsg = `Budget lines for Agreement ${agreementName} have been declined for ${bliToStatus} Status. These Budget Lines will remain in Draft Status until further action is taken.`;
        }
        if (EXECUTING_STATUS_APPROVE) {
            heading = `Are you sure you want to approve these budget lines for ${bliToStatus} Status? This will start the procurement process.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = `Budget Lines Approved for ${bliToStatus} Status`;
            alertMsg = `Budget lines for Agreement ${agreementName} have been successfully approved for ${bliToStatus} Status. This will start the procurement process which will be tracked through the Procurement Tracker on this Agreement.`;
        }
        if (EXECUTING_STATUS_REJECT) {
            heading = `Are you sure you want to decline these budget lines for ${bliToStatus} Status?`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = `Budget Lines Declined for ${bliToStatus} Status`;
            alertMsg = `Budget lines for Agreement ${agreementName} have been declined for ${bliToStatus} Status. These Budget Lines will remain in Planned Status until further action is taken.`;
        }
        setShowModal(true);
        setModalProps({
            heading,
            actionButtonText: btnText,
            handleConfirm: () => {
                reviewCR(payload)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("Review Change Request:", fulfilled);
                        setAlert({
                            type: alertType,
                            heading: alertHeading,
                            message: alertMsg
                        });
                    })
                    .catch((rejected) => {
                        console.error("Error Reviewing Change Request:", rejected);
                        setAlert({
                            type: "error",
                            heading: "Error",
                            message: "An error occurred. Please try again.",
                            redirectUrl: "/error"
                        });
                    });
            }
        });
    };
    return {
        handleReviewChangeRequest,
        showModal,
        setShowModal,
        modalProps,
        setModalProps
    };
};

export default useChangeRequest;
