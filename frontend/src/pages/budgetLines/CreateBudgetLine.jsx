import App from "../../App";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import ProjectSelect from "../../components/UI/Form/ProjectSelect";
import { AgreementSelect } from "./AgreementSelect";
import CreateBudgetLinesForm from "../../components/UI/Form/CreateBudgetLinesForm";
import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";
import {
    setAgreements,
    setBudgetLineAdded,
    setEnteredDescription,
    setEnteredAmount,
    setEnteredMonth,
    setEnteredYear,
    setEnteredDay,
    setEnteredComments,
    setProcurementShop,
    setSelectedProcurementShop,
    deleteBudgetLineAdded,
    setSelectedAgreement,
    setSelectedProject,
} from "./createBudgetLineSlice";
import PreviewTable from "./PreviewTable";
import { ProcurementShopSelect } from "./ProcurementShopSelect";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import { Alert } from "../../components/UI/Alert/Alert";
import Modal from "../../components/UI/Modal/Modal";
import { ProjectAgreementSummaryCard } from "./ProjectAgreementSummaryCard";
import { postBudgetLineItems } from "../../api/postBudgetLineItems";

const StepOne = ({ goToNext }) => {
    const dispatch = useDispatch();
    const selectedResearchProject = useSelector((state) => state.createBudgetLine.selected_project);
    const selectedAgreement = useSelector((state) => state.createBudgetLine.selected_agreement);
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects_list);

    const clearAgreementState = () => {
        dispatch(setAgreements([]));
        dispatch(setSelectedAgreement(-1));
    };

    return (
        <>
            <h1 className="font-sans-lg">Create New Budget Line</h1>
            <p>Step One: Text explaining this page</p>
            <StepIndicator steps={["Project & Agreement", "Budget Lines", "Review"]} currentStep={1} />
            <h2 className="font-sans-lg">Select a Project</h2>
            <p>
                Select the project this budget line should be associated with. If you need to create a new project,
                click Add New Project.
            </p>
            <ProjectSelect
                researchProjects={researchProjects}
                selectedResearchProject={selectedResearchProject}
                setSelectedProject={setSelectedProject}
                clearFunction={clearAgreementState}
            />
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
                <span className="text-base margin-left-2 margin-right-2">or</span>
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
    const selectedProcurementShop = useSelector((state) => state.createBudgetLine.selected_procurement_shop);
    const selectedResearchProject = useSelector((state) => state.createBudgetLine.selected_project);
    const selectedAgreement = useSelector((state) => state.createBudgetLine.selected_agreement);
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [alertProps, setAlertProps] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const showAlert = async (type, heading, message) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.scrollTo(0, 0);
        setIsAlertActive(true);
        setAlertProps({ type, heading, message });

        await new Promise((resolve) => setTimeout(resolve, 6000));
        setIsAlertActive(false);
        setAlertProps({});
    };

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

    const saveBudgetLineItems = (event) => {
        event.preventDefault();
        const newBudgetLineItems = budgetLinesAdded.filter(
            // eslint-disable-next-line no-prototype-builtins
            (budgetLineItem) => !budgetLineItem.hasOwnProperty("created_on")
        );
        postBudgetLineItems(newBudgetLineItems).then(() => console.log("Created New BLIs."));
    };

    return (
        <>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <>
                    <h2 className="font-sans-lg">Create New Budget Line</h2>
                    <p>Step Two: Text explaining this page</p>
                </>
            )}
            <StepIndicator steps={["Project & Agreement", "Budget Lines", "Review"]} currentStep={2} />
            <ProjectAgreementSummaryCard
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
            />
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
            <CreateBudgetLinesForm
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                showAlert={showAlert}
            />
            <h2 className="font-sans-lg">Budget Lines</h2>
            <p>
                This is a list of all budget lines for the selected project and agreement. The budget lines you add will
                display in draft status. The Fiscal Year (FY) will populate based on the election date you provide.
            </p>
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
                                dispatch(setSelectedAgreement(-1));
                                setModalProps({});
                                goBack();
                            },
                        });
                    }}
                >
                    Back
                </button>
                <button className="usa-button" onClick={saveBudgetLineItems}>
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
        <StepIndicator steps={["Project & Agreement", "Budget Lines", "Review"]} currentStep={3} />
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
    const selectedProject = useSelector((state) => state.createBudgetLine.selected_project);

    // Get initial list of Agreements (dependent on Research Project Selection)
    useEffect(() => {
        const getAgreementsAndSetState = async () => {
            if (selectedProject?.id > 0) {
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

    useEffect(() => {
        const getAgreementsAndSetState = async () => {
            if (selectedProject?.id > 0) {
                const results = await getAgreementsByResearchProjectFilter(selectedProject?.id);
                dispatch(setAgreements(results));
            }
        };
        getAgreementsAndSetState().catch(console.error);
    }, [dispatch, selectedProject]);

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
