import React from "react";
import { useDeleteBudgetLineItemMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";

function useAllBudgetLinesTable(budgetLines) {
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [deleteBudgetLineItem] = useDeleteBudgetLineItemMutation();
    const { setAlert } = useAlert();

    const handleDeleteBudgetLine = (budgetLineId) => {
        const budgetLine = budgetLines.find((bl) => bl.id === budgetLineId);
        const budgetLineDisplayName = budgetLine?.id;
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete budget line ${budgetLineDisplayName}?`,
            actionButtonText: "Delete",
            handleConfirm: () => {
                deleteBudgetLineItem(budgetLineId)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("Deleted BLI:", fulfilled);
                        setAlert({
                            type: "success",
                            heading: "Budget Line Deleted",
                            message: `Budget line ${budgetLineDisplayName} has been successfully deleted.`
                        });
                    })
                    .catch((rejected) => {
                        console.error("Error Deleting Budget Line");
                        console.error({ rejected });
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
    return { showModal, setShowModal, modalProps, handleDeleteBudgetLine };
}

export default useAllBudgetLinesTable;
