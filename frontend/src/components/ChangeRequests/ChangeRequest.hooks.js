import * as React from "react";
import { useReviewChangeRequestMutation } from "../../api/opsAPI";
import useAlert from "../../hooks/use-alert.hooks";

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
     * @param {number} id - The ID of the change request.
     * @param {string} action - The action to be performed. Either "APPROVE" or "REJECT".
     * @param {string} notes - The reviewer notes.
     * @returns {void} - The result of the mutation.
     */
    const handleReviewChangeRequest = (id, action, notes) => {
        const payload = {
            change_request_id: id,
            action,
            reviewer_notes: notes
        };
        setShowModal(true);
        // TODO: make Modal heading dynamic per action
        // TODO: make Alert message dynamic per action
        setModalProps({
            heading:
                "Are you sure you want to approve this budget change? The agreement will be updated after your approval.",
            actionButtonText: "Approve",
            handleConfirm: () => {
                reviewCR(payload)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("Review Change Request:", fulfilled);
                        setAlert({
                            type: "success",
                            heading: "Budget Change Approved",
                            message: `The agreement “Agreement Title” has been successfully updated.`
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
