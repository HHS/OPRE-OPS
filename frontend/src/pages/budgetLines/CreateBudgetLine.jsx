import App from "../../App";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { StepIndicatorOne } from "../../components/UI/StepIndicator/StepIndicatorOne";
import { StepIndicatorTwo } from "../../components/UI/StepIndicator/StepIndicatorTwo";
import { StepIndicatorThree } from "../../components/UI/StepIndicator/StepIndicatorThree";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import { ProjectSelect } from "./ProjectSelect";
import { AgreementSelect } from "./AgreementSelect";
import { CanSelect } from "./CanSelect";
import { DesiredAwardDate } from "./DesiredAwardDate";
import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";
import {
    setAgreements,
    setBudgetLineAdded,
    setEditBudgetLineAdded,
    setEnteredDescription,
    setEnteredAmount,
    setSelectedCan,
    setEnteredMonth,
    setEnteredYear,
    setEnteredDay,
    setEnteredComments,
    setProcurementShop,
    setSelectedProcurementShop,
    deleteBudgetLineAdded,
} from "./createBudgetLineSlice";
import { ProcurementShopSelect } from "./ProcurementShopSelect";
import { PreviewTable } from "./PreviewTable";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import { Alert } from "../../components/UI/Alert/Alert";
import { Modal } from "../../components/UI/Modal/Modal";

const StepOne = ({ goToNext }) => {
    const selectedResearchProject = useSelector((state) => state.createBudgetLine.selected_project);
    const selectedAgreement = useSelector((state) => state.createBudgetLine.selected_agreement);
    return (
        <>
            <h2 className="font-sans-lg">Create New Budget Line</h2>
            <p>Step One: Text explaining this page</p>
            <StepIndicatorOne />
            <h2 className="font-sans-lg">Select a Project</h2>
            <p>
                Select the project this budget line should be associated with. If you need to create a new project,
                click Add New Project.
            </p>
            <ProjectSelect />
            <h2 className="font-sans-lg">Select an Agreement</h2>
            <p>Select the project and agreement this budget line should be associated with.</p>
            <AgreementSelect />
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button"
                    onClick={() => goToNext({ project: "Red X 2.0" })}
                    // disable if no project or agreement is selected
                    disabled={!(selectedResearchProject?.id && selectedAgreement?.id)}
                >
                    Continue
                </button>
            </div>
            <div className="display-flex flex-align-center margin-top-6">
                <div className="border-bottom-1px border-base-light width-full" />
                <span className="text-base-light margin-left-2 margin-right-2">or</span>
                <div className="border-bottom-1px border-base-light width-full" />
            </div>
            <div className="grid-row flex-justify-center">
                <button className="usa-button usa-button--outline margin-top-6 margin-bottom-6">Add New Project</button>
                <button className="usa-button usa-button--outline margin-top-6 margin-bottom-6">
                    Add New Agreement
                </button>
            </div>
        </>
    );
};
const StepTwo = ({ goBack, goToNext }) => {
    const dispatch = useDispatch();
    const budgetLinesAdded = useSelector((state) => state.createBudgetLine.budget_lines_added);
    const selectedCan = useSelector((state) => state.createBudgetLine.selected_can);
    const enteredDescription = useSelector((state) => state.createBudgetLine.entered_description);
    const enteredAmount = useSelector((state) => state.createBudgetLine.entered_amount);
    const enteredMonth = useSelector((state) => state.createBudgetLine.entered_month);
    const enteredDay = useSelector((state) => state.createBudgetLine.entered_day);
    const enteredYear = useSelector((state) => state.createBudgetLine.entered_year);
    const enteredComments = useSelector((state) => state.createBudgetLine.entered_comments);
    const selectedProcurementShop = useSelector((state) => state.createBudgetLine.selected_procurement_shop);
    const selectedResearchProject = useSelector((state) => state.createBudgetLine.selected_project);
    const selectedAgreement = useSelector((state) => state.createBudgetLine.selected_agreement);
    const isEditing = useSelector((state) => state.createBudgetLine.is_editing_budget_line);
    const budgetLineBeingEdited = useSelector((state) => state.createBudgetLine.budget_line_being_edited);
    const [isAlert, setIsAlert] = useState(false);
    const [alertMsg, setAlertMsg] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const showAlert = async (type, heading, message) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.scrollTo(0, 0);
        setIsAlert(true);
        setAlertMsg({ type, heading, message });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsAlert(false);
        setAlertMsg({});
    };

    const handleCancelEdit = () => {
        dispatch(setEditBudgetLineAdded({}));
    };

    const handleDeleteBudgetLine = (budgetLineId) => {
        dispatch(deleteBudgetLineAdded(budgetLineId));
        showAlert("success", "Budget Line Deleted", "The budget line has been successfully deleted.");
    };

    const handleEditForm = (e) => {
        e.preventDefault();
        dispatch(
            setEditBudgetLineAdded({
                id: budgetLinesAdded[budgetLineBeingEdited].id,
                line_description: enteredDescription,
                comments: enteredComments,
                can_id: selectedCan?.id,
                can_number: selectedCan?.number,
                agreement_id: selectedAgreement?.id,
                amount: enteredAmount,
                date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}`,
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
                    line_description: enteredDescription,
                    comments: enteredComments,
                    can_id: selectedCan?.id,
                    can_number: selectedCan?.number,
                    agreement_id: selectedAgreement?.id,
                    amount: enteredAmount,
                    status: "DRAFT",
                    date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}`,
                    psc_fee_amount: selectedProcurementShop?.fee,
                    created_on: new Date().toISOString(),
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

    return (
        <>
            <button className="usa-button" onClick={() => setShowModal(true)}>
                show modal
            </button>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            {isAlert ? (
                <Alert heading={alertMsg.heading} type={alertMsg.type}>
                    {alertMsg.message}
                </Alert>
            ) : (
                <>
                    <h2 className="font-sans-lg">Create New Budget Line</h2>
                    <p>Step Two: Text explaining this page</p>
                </>
            )}
            <StepIndicatorTwo />
            <h2 className="font-sans-lg">Procurement Shop</h2>
            <p>
                Select the Procurement Shop, and the fee rates will be populated in the table below. If this is an
                active agreement, it will default to the procurement shop currently being used.
            </p>
            <ProcurementShopSelect budgetLinesLength={budgetLinesAdded.length} />
            <h2 className="font-sans-lg margin-top-3">Budget Line Details</h2>
            <p>
                Complete the information below to create new budget lines. Select Add Budget Line to create multiple
                budget lines.
            </p>
            <form className="grid-row grid-gap">
                <div className="grid-col-4">
                    <div className="usa-form-group">
                        <label className="usa-label" htmlFor="bl-description">
                            Description
                        </label>
                        <input
                            className="usa-input"
                            id="bl-description"
                            name="bl-description"
                            type="text"
                            value={enteredDescription || ""}
                            onChange={(e) => dispatch(setEnteredDescription(e.target.value))}
                            required
                        />
                    </div>
                    <div className="usa-form-group">
                        <CanSelect />
                    </div>
                </div>
                <div className="grid-col-4">
                    <DesiredAwardDate />
                    <div className="usa-form-group">
                        <label className="usa-label" htmlFor="bl-amount">
                            Amount
                        </label>
                        <CurrencyFormat
                            id="bl-amount"
                            value={enteredAmount || ""}
                            className="usa-input"
                            name="bl-amount"
                            thousandSeparator={true}
                            decimalScale={2}
                            renderText={(value) => value}
                            placeholder="$"
                            onValueChange={(values) => {
                                const { floatValue } = values;
                                dispatch(setEnteredAmount(floatValue));
                            }}
                        />
                    </div>
                </div>
                <div className="grid-col-4">
                    <div className="usa-character-count">
                        <div className="usa-form-group">
                            <label className="usa-label" htmlFor="with-hint-textarea">
                                Notes (optional)
                            </label>
                            <span id="with-hint-textarea-hint" className="usa-hint">
                                Maximum 150 characters
                            </span>
                            <textarea
                                className="usa-textarea usa-character-count__field"
                                id="with-hint-textarea"
                                maxLength="150"
                                name="with-hint-textarea"
                                rows="5"
                                aria-describedby="with-hint-textarea-info with-hint-textarea-hint"
                                style={{ height: "7rem" }}
                                value={enteredComments || ""}
                                onChange={(e) => dispatch(setEnteredComments(e.target.value))}
                            ></textarea>
                        </div>
                        <span id="with-hint-textarea-info" className="usa-character-count__message sr-only">
                            You can enter up to 150 characters
                        </span>
                    </div>
                    {isEditing ? (
                        <div className="display-flex flex-justify-end">
                            <button
                                className="usa-button usa-button--unstyled margin-top-2 margin-right-2"
                                onClick={() => handleCancelEdit()}
                            >
                                Cancel
                            </button>
                            <button
                                className="usa-button usa-button--outline margin-top-2  margin-right-0"
                                onClick={handleEditForm}
                            >
                                Update Budget Line
                            </button>
                        </div>
                    ) : (
                        <button
                            className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                            onClick={handleSubmitForm}
                        >
                            Add Budget Line
                        </button>
                    )}
                </div>
            </form>
            <h2 className="font-sans-lg">Budget Lines</h2>
            <p>
                This is a list of all budget lines for the selected project and agreement. The budget lines you add will
                display in draft status. The Fiscal Year (FY) will populate based on the election date you provide.
            </p>
            <div className="font-family-sans font-12px">
                <dl className="margin-0 padding-y-2 padding-x-105">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="text-semibold margin-0">{selectedResearchProject?.title}</dd>
                    <dt className="margin-0 text-base-dark margin-top-2">Agreement</dt>
                    <dd className="text-semibold margin-0">{selectedAgreement?.name}</dd>
                </dl>
            </div>
            <PreviewTable handleDeleteBudgetLine={handleDeleteBudgetLine} />
            <div className="grid-row flex-justify-end margin-top-1">
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
                                dispatch(setBudgetLineAdded([]));
                                dispatch(setEnteredAmount(null));
                                dispatch(setEnteredComments(""));
                                dispatch(setEnteredDescription(""));
                                dispatch(setSelectedProcurementShop({}));
                                dispatch(setEnteredDay(""));
                                dispatch(setEnteredMonth(""));
                                dispatch(setEnteredYear(""));
                                goBack();
                            },
                        });
                    }}
                >
                    Back
                </button>
                <button className="usa-button" onClick={() => goToNext()}>
                    Continue
                </button>
            </div>
        </>
    );
};

const StepThree = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Three: Text explaining this page</p>
        <StepIndicatorThree />

        <div className="grid-row flex-justify-end">
            <button className="usa-button usa-button--unstyled" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ name: "John Doe" })}>
                Continue
            </button>
        </div>
    </>
);

export const CreateBudgetLine = () => {
    const dispatch = useDispatch();
    const selectedProject = useSelector((state) => state.createBudgetLine.selectedProject);

    // Get initial list of Agreements (dependent on Research Project Selection)
    useEffect(() => {
        const getAgreementsAndSetState = async () => {
            if (selectedProject) {
                const agreements = await getAgreementsByResearchProjectFilter(selectedProject?.id);
                dispatch(setAgreements(agreements));
            }
        };

        getAgreementsAndSetState().catch(console.error);

        return () => {
            dispatch(setAgreements([]));
        };
    }, [dispatch, selectedProject]);

    useEffect(() => {
        const getProcurementShopsAndSetState = async () => {
            const results = await getProcurementShopList();
            dispatch(setProcurementShop(results));
        };
        getProcurementShopsAndSetState().catch(console.error);
    }, [dispatch]);

    return (
        <App>
            <CreateBudgetLineFlow
                onFinish={(data) => {
                    console.log("budget line has: " + JSON.stringify(data, null, 2));
                    alert("Budget Line Created!");
                }}
            >
                <StepOne />
                <StepTwo />
                <StepThree />
            </CreateBudgetLineFlow>
        </App>
    );
};
