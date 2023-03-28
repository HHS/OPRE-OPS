import App from "../../App";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StepIndicatorOne } from "../../components/UI/StepIndicator/StepIndicatorOne";
import { StepIndicatorTwo } from "../../components/UI/StepIndicator/StepIndicatorTwo";
import { StepIndicatorThree } from "../../components/UI/StepIndicator/StepIndicatorThree";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import { ProjectSelect } from "./ProjectSelect";
import { AgreementSelect } from "./AgreementSelect";
import { CanSelect } from "./CanSelect";
import { DesiredAwardDate } from "./DesiredAwardDate";
import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";
import { setAgreements, setBudgetLineAdded } from "./createBudgetLineSlice";
import { ProcurementShopSelect } from "./ProcurementShopSelect";

const StepOne = ({ goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step One: Text explaining this page</p>
        <StepIndicatorOne />
        <h2 className="font-sans-lg">Select a Project</h2>
        <p>
            Select the project this budget line should be associated with. If you need to create a new project, click
            Add New Project.
        </p>
        <ProjectSelect />
        <h2 className="font-sans-lg">Select an Agreement</h2>
        <p>Select the project and agreement this budget line should be associated with.</p>
        <AgreementSelect />
        <div className="grid-row flex-justify-end margin-top-8">
            <button className="usa-button" onClick={() => goToNext({ project: "Red X 2.0" })}>
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
            <button className="usa-button usa-button--outline margin-top-6 margin-bottom-6">Add New Agreement</button>
        </div>
    </>
);
const StepTwo = ({ goBack, goToNext }) => {
    const dispatch = useDispatch();
    const budgetLinesAdded = useSelector((state) => state.createBudgetLine.budget_lines_added);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState();

    const handleSubmitForm = (e) => {
        e.preventDefault();
        dispatch(
            setBudgetLineAdded({
                line_description: description,
                amount,
            })
        );
    };
    return (
        <>
            <h2 className="font-sans-lg">Create New Budget Line</h2>
            <p>Step Two: Text explaining this page</p>
            <StepIndicatorTwo />
            <h2 className="font-sans-lg">Procurement Shop</h2>
            <p>
                Select the Procurement Shop, and the fee rates will be populated in the table below. If this is an
                active agreement, it will default to the procurement shop currently being used.
            </p>
            <ProcurementShopSelect />
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
                            defaultValue={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                        <input
                            className="usa-input"
                            id="bl-amount"
                            name="bl-amount"
                            type="number"
                            value={amount}
                            placeholder="$"
                            onChange={(e) => setAmount(Number(e.target.value))}
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
                            ></textarea>
                        </div>
                        <span id="with-hint-textarea-info" className="usa-character-count__message sr-only">
                            You can enter up to 150 characters
                        </span>
                    </div>
                    <button
                        className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                        onClick={handleSubmitForm}
                    >
                        Add Budget Line
                    </button>
                </div>
            </form>

            <div className="grid-row flex-justify-end margin-top-1">
                <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                    Back
                </button>
                <button className="usa-button" onClick={() => goToNext({ name: "John Doe" })}>
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
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
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
