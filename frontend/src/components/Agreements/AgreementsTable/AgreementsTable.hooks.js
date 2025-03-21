import React from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteAgreementMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";

export const useNavigateAgreementReview = () => {
    const navigate = useNavigate();
    /**
     * Navigates to the agreement review page.
     * @param {number} id - The id of the agreement to review.
     */
    return (id) => {
        navigate(`/agreements/review/${id}`);
    };
};

export const useHandleEditAgreement = () => {
    const navigate = useNavigate();
    /**
     * Navigates to the agreement edit page.
     * @param {number} agreementId - The id of the agreement to edit.
     */
    const handleEditAgreement = (agreementId) => {
        navigate(`/agreements/${agreementId}?mode=edit`);
    };

    return handleEditAgreement;
};

export const useSetSortConditions = () => {
    const [sortCondition, setSortCondition] = React.useState(null);
    const [sortDescending, setSortDescending] = React.useState(true);

    const setSortConditions = (selectedSortCondition, isSortDescending) => {
        if (selectedSortCondition != sortCondition) {
            setSortCondition(selectedSortCondition);
            setSortDescending(true);
        } else {
            setSortDescending(isSortDescending);
        }
    };

    return {sortDescending, sortCondition, setSortConditions}
}

export const useHandleDeleteAgreement = () => {
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [deleteAgreement] = useDeleteAgreementMutation();
    const { setAlert } = useAlert();

    /**
     * Deletes an agreement.
     * @param {number} id - The id of the agreement to delete.
     * @param {string} agreementName - The name of the agreement to delete.
     * @returns {void}
     */
    const handleDeleteAgreement = (id, agreementName) => {
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete Agreement ${agreementName}?`,
            actionButtonText: "Delete",
            handleConfirm: () => {
                deleteAgreement(id)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log(`DELETE agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                        setAlert({
                            type: "success",
                            heading: "Agreement Deleted",
                            message: `The agreement ${agreementName} has been successfully deleted.`
                        });
                    })
                    .catch((rejected) => {
                        console.error(`DELETE agreement rejected: ${JSON.stringify(rejected, null, 2)}`);
                        setAlert({
                            type: "error",
                            heading: "Error",
                            message: "An error occurred while deleting the agreement.",
                            redirectUrl: "/error"
                        });
                    });
            }
        });
    };

    return { handleDeleteAgreement, showModal, setShowModal, modalProps, setModalProps };
};
