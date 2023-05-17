import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import { ProjectAgreementSummaryCard } from "../../components/UI/Form/ProjectAgreementSummaryCard/ProjectAgreementSummaryCard";
import PreviewTable from "../../components/UI/PreviewTable/PreviewTable";
import { Alert } from "../../components/UI/Alert/Alert";
import Modal from "../../components/UI/Modal/Modal";
import CreateBudgetLinesForm from "../../components/UI/Form/CreateBudgetLinesForm/CreateBudgetLinesForm";
// TODO: replace with context and reducer pattern
import {
    setEnteredAmount,
    setEnteredComments,
    setEnteredDay,
    setEnteredDescription,
    setEnteredMonth,
    setEnteredYear,
    setAgreementDescription,
    setAgreementId,
    setAgreementIncumbent,
    setAgreementNotes,
    setAgreementProcurementShop,
    setAgreementProductServiceCode,
    setAgreementProject,
    setAgreementProjectOfficer,
    setAgreementTeamMembers,
    setAgreementTitle,
    setSelectedAgreementReason,
    setSelectedAgreementType,
    setSelectedProcurementShop,
    setSelectedProject,
    setSelectedCan,
    setEditBudgetLineAdded,
    setBudgetLineAdded,
    deleteBudgetLineAdded,
    duplicateBudgetLineAdded,
    editBudgetLineAdded,
} from "../agreements/createAgreementSlice";
import { postBudgetLineItems } from "../../api/postBudgetLineItems";

export const StepCreateBudgetLines = ({ goBack, goToNext, wizardSteps }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const budgetLinesAdded = useSelector((state) => state.createAgreement.budget_lines_added);
    const selectedProcurementShop = useSelector((state) => state.createAgreement.selected_procurement_shop);
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const selectedAgreement = useSelector((state) => state.createAgreement.agreement);
    const selectedCan = useSelector((state) => state.createAgreement.selected_can);
    const enteredDescription = useSelector((state) => state.createAgreement.entered_description);
    const enteredAmount = useSelector((state) => state.createAgreement.entered_amount);
    const enteredMonth = useSelector((state) => state.createAgreement.entered_month);
    const enteredDay = useSelector((state) => state.createAgreement.entered_day);
    const enteredYear = useSelector((state) => state.createAgreement.entered_year);
    const enteredComments = useSelector((state) => state.createAgreement.entered_comments);
    const isEditing = useSelector((state) => state.createAgreement.is_editing_budget_line);
    const budgetLineBeingEdited = useSelector((state) => state.createAgreement.budget_line_being_edited);
    let loggedInUserName = useSelector((state) => state.auth.activeUser.full_name);
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [alertProps, setAlertProps] = React.useState({});
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    // NOTE: set to logged in user to Sheila if no name is found
    if (!loggedInUserName) {
        loggedInUserName = "Sheila Celentano";
    }

    const showAlert = async (type, heading, message) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.scrollTo(0, 0);
        setIsAlertActive(true);
        setAlertProps({ type, heading, message });

        await new Promise((resolve) => setTimeout(resolve, 6000));
        setIsAlertActive(false);
        setAlertProps({});
    };
    // FORM METHODS
    const handleDeleteBudgetLine = (budgetLineId) => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to delete this budget line?",
            actionButtonText: "Delete",
            handleConfirm: () => {
                dispatch(deleteBudgetLineAdded(budgetLineId));
                showAlert("success", "Budget Line Deleted", "The budget line has been successfully deleted.");
                setModalProps({});
            },
        });
    };

    const resetBLIState = () => {
        dispatch(setBudgetLineAdded([]));
        dispatch(setEnteredAmount(null));
        dispatch(setEnteredComments(""));
        dispatch(setEnteredDescription(""));
        dispatch(setSelectedProcurementShop(-1));
        dispatch(setEnteredDay(""));
        dispatch(setEnteredMonth(""));
        dispatch(setEnteredYear(""));
    };

    const resetAgreementState = () => {
        dispatch(setSelectedAgreementType(null));
        dispatch(setAgreementTitle(""));
        dispatch(setAgreementDescription(""));
        dispatch(setAgreementProductServiceCode(null));
        dispatch(setAgreementProcurementShop(null));
        dispatch(setSelectedAgreementReason(null));
        dispatch(setAgreementIncumbent(null));
        dispatch(setAgreementProjectOfficer(null));
        dispatch(setAgreementTeamMembers([]));
        dispatch(setAgreementNotes(""));
        dispatch(setAgreementId(null));
        dispatch(setAgreementProject(null));
        dispatch(setSelectedProject(-1));
    };

    const handleCancelEdit = () => {
        dispatch(setEditBudgetLineAdded({}));
    };

    const handleEditForm = (e) => {
        e.preventDefault();
        dispatch(
            setEditBudgetLineAdded({
                id: budgetLinesAdded[budgetLineBeingEdited].id,
                line_description: enteredDescription,
                comments: enteredComments,
                can_id: selectedCan?.id,
                can: selectedCan,
                agreement_id: selectedAgreement?.id,
                amount: enteredAmount,
                date_needed:
                    enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
                psc_fee_amount: selectedProcurementShop?.fee,
            })
        );
        showAlert("success", "Budget Line Updated", "The budget line has been successfully edited.");
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        dispatch(
            setBudgetLineAdded([
                ...budgetLinesAdded,
                {
                    id: crypto.getRandomValues(new Uint32Array(1))[0],
                    line_description: enteredDescription || "",
                    comments: enteredComments || "",
                    can_id: selectedCan?.id || null,
                    can: selectedCan || null,
                    agreement_id: selectedAgreement?.id || null,
                    amount: enteredAmount || 0,
                    status: "DRAFT",
                    date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}` || null,
                    psc_fee_amount: selectedProcurementShop?.fee || null,
                },
            ])
        );
        showAlert("success", "Budget Line Added", "The budget line has been successfully added.");

        //reset form
        dispatch(setEnteredDescription(""));
        dispatch(setEnteredAmount(null));
        dispatch(setSelectedCan({}));
        dispatch(setEnteredMonth(""));
        dispatch(setEnteredDay(""));
        dispatch(setEnteredYear(""));
        dispatch(setEnteredComments(""));
    };

    const saveBudgetLineItems = (event) => {
        event.preventDefault();
        const newBudgetLineItems = budgetLinesAdded.filter(
            // eslint-disable-next-line no-prototype-builtins
            (budgetLineItem) => !budgetLineItem.hasOwnProperty("created_on")
        );
        postBudgetLineItems(newBudgetLineItems).then(() => console.log("Created New BLIs."));

        resetBLIState();
        resetAgreementState();
        goToNext();
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your agreement will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                resetBLIState();
                resetAgreementState();
                setModalProps({});
                navigate("/agreements/");
            },
        });
    };

    const handleSetBudgetLineForEditing = (budgetLine) => {
        dispatch(editBudgetLineAdded(budgetLine));
    };

    const handleDuplicateBudgetLine = (budgetLine) => {
        dispatch(duplicateBudgetLineAdded({ ...budgetLine, created_by: loggedInUserName }));
    };
    return (
        <>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <>
                    <h1 className="font-sans-lg">Create New Agreement</h1>
                    <p>Follow the steps to create an Agreement</p>
                </>
            )}
            <StepIndicator steps={wizardSteps} currentStep={3} />
            <ProjectAgreementSummaryCard
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
            />
            <h2 className="font-sans-lg margin-top-3">Budget Line Details</h2>
            <p>
                Complete the information below to create new budget lines. Select Add Budget Line to create multiple
                budget lines.
            </p>
            <CreateBudgetLinesForm
                selectedCan={selectedCan}
                enteredDescription={enteredDescription}
                enteredAmount={enteredAmount}
                enteredMonth={enteredMonth}
                enteredDay={enteredDay}
                enteredYear={enteredYear}
                enteredComments={enteredComments}
                isEditing={isEditing}
                setEnteredDescription={(value) => dispatch(setEnteredDescription(value))}
                setSelectedCan={(value) => dispatch(setSelectedCan(value))}
                setEnteredAmount={(value) => dispatch(setEnteredAmount(value))}
                setEnteredMonth={(value) => dispatch(setEnteredMonth(value))}
                setEnteredDay={(value) => dispatch(setEnteredDay(value))}
                setEnteredYear={(value) => dispatch(setEnteredYear(value))}
                setEnteredComments={(value) => dispatch(setEnteredComments(value))}
                handleEditForm={handleEditForm}
                handleResetForm={handleCancelEdit}
                handleSubmitForm={handleSubmitForm}
            />
            <h2 className="font-sans-lg">Budget Lines</h2>
            <p>
                This is a list of all budget lines for the selected project and agreement. The budget lines you add will
                display in draft status. The Fiscal Year (FY) will populate based on the election date you provide.
            </p>

            <PreviewTable
                loggedInUserName={loggedInUserName}
                budgetLinesAdded={budgetLinesAdded}
                handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                handleDeleteBudgetLine={handleDeleteBudgetLine}
                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
            />
            <div className="grid-row flex-justify margin-top-1">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={() => {
                        // if no budget lines have been added, go back
                        if (budgetLinesAdded.length === 0) {
                            goBack();
                            return;
                        }
                        // if budget lines have been added, show modal
                        setShowModal(true);
                        setModalProps({
                            heading: "Are you sure you want to go back? Your budget lines will not be saved.",
                            actionButtonText: "Go Back",
                            handleConfirm: () => {
                                resetBLIState();
                                setModalProps({});
                                goBack();
                            },
                        });
                    }}
                >
                    Back
                </button>
                <div>
                    <button className="usa-button usa-button--unstyled margin-right-2" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="usa-button" onClick={saveBudgetLineItems}>
                        Create Agreement
                    </button>
                </div>
            </div>
        </>
    );
};
