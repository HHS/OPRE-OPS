// import { postBudgetLineItems } from "../../../../api/postBudgetLineItems";

// export const showAlert = async (type, heading, message) => {
//     await new Promise((resolve) => setTimeout(resolve, 500));
//     window.scrollTo(0, 0);
//     setIsAlertActive(true);
//     setAlertProps({ type, heading, message });

//     await new Promise((resolve) => setTimeout(resolve, 6000));
//     setIsAlertActive(false);
//     setAlertProps({});
// };

// export const handleSubmitForm = (e) => {
//     e.preventDefault();
//     dispatch({
//         type: "ADD_BUDGET_LINE",
//         payload: {
//             id: crypto.getRandomValues(new Uint32Array(1))[0],
//             line_description: enteredDescription || "",
//             comments: enteredComments || "",
//             can_id: selectedCan?.id || null,
//             can: selectedCan || null,
//             agreement_id: selectedAgreement?.id || null,
//             amount: enteredAmount || 0,
//             status: "DRAFT",
//             date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}` || null,
//             psc_fee_amount: selectedProcurementShop?.fee || null,
//         },
//     });
//     dispatch({ type: "RESET_FORM" });
//     showAlert("success", "Budget Line Added", "The budget line has been successfully added.");
// };

// export const handleEditForm = (e) => {
//     e.preventDefault();
//     dispatch({
//         type: "EDIT_BUDGET_LINE",
//         payload: {
//             id: budgetLinesAdded[budgetLineBeingEdited].id,
//             line_description: enteredDescription,
//             comments: enteredComments,
//             can_id: selectedCan?.id,
//             can: selectedCan,
//             agreement_id: selectedAgreement?.id,
//             amount: enteredAmount,
//             date_needed:
//                 enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
//             psc_fee_amount: selectedProcurementShop?.fee,
//         },
//     });

//     dispatch({ type: "RESET_FORM" });
//     showAlert("success", "Budget Line Updated", "The budget line has been successfully edited.");
// };

// export const handleDeleteBudgetLine = (budgetLineId) => {
//     setShowModal(true);
//     setModalProps({
//         heading: "Are you sure you want to delete this budget line?",
//         actionButtonText: "Delete",
//         handleConfirm: () => {
//             dispatch({
//                 type: "DELETE_BUDGET_LINE",
//                 id: budgetLineId,
//             });
//             dispatch({ type: "RESET_FORM" });
//             showAlert("success", "Budget Line Deleted", "The budget line has been successfully deleted.");
//             setModalProps({});
//         },
//     });
// };

// export const saveBudgetLineItems = (event) => {
//     event.preventDefault();
//     const newBudgetLineItems = budgetLinesAdded.filter(
//         // eslint-disable-next-line no-prototype-builtins
//         (budgetLineItem) => !budgetLineItem.hasOwnProperty("created_on")
//     );
//     postBudgetLineItems(newBudgetLineItems).then(() => console.log("Created New BLIs."));
//     dispatch({ type: "RESET_FORM_AND_BUDGET_LINES" });
//     goToNext();
// };

// export const handleResetForm = () => dispatch({ type: "RESET_FORM" });

// export const handleSetBudgetLineForEditing = (budgetLine) => {
//     dispatch({ type: "SET_BUDGET_LINE_FOR_EDITING", payload: budgetLine });
// };

// export const handleDuplicateBudgetLine = (budgetLine) => {
//     dispatch({
//         type: "DUPLICATE_BUDGET_LINE",
//         payload: { ...budgetLine, created_by: loggedInUserFullName },
//     });
// };
