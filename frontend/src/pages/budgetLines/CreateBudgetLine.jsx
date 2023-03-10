import App from "../../App";
import { StepIndicatorOne } from "../../components/UI/StepIndicator/StepIndicatorOne";
import { StepIndicatorTwo } from "../../components/UI/StepIndicator/StepIndicatorTwo";
import { StepIndicatorThree } from "../../components/UI/StepIndicator/StepIndicatorThree";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import { ProjectSelect } from "./ProjectSelect";
import { AgreementSelect } from "./AgreementSelect";
import { CanSelect } from "./CanSelect";
import { DesiredAwardDate } from "./DesiredAwardDate";

const StepOne = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step One: Text explaining this page</p>
        <StepIndicatorOne />
        <h2 className="font-sans-lg">Select a Project or Create a New One</h2>
        <p>
            Select the project this budget line should be associated with. If you need to create a new project, click
            Add New Project.
        </p>
        <ProjectSelect />
        <button className="usa-button usa-button--outline margin-top-6 margin-bottom-6">Add New Project</button>
        <h2 className="font-sans-lg">Select an Agreement or Create a New One</h2>
        <p>Select the project and agreement this budget line should be associated with.</p>
        <AgreementSelect />
        <button className="usa-button usa-button--outline margin-top-6 margin-bottom-6">Add New Agreement</button>
        <div className="grid-row flex-justify-end">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ project: "Red X 2.0" })}>
                Continue
            </button>
        </div>
    </>
);
const StepTwo = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Two: Text explaining this page</p>
        <StepIndicatorTwo />
        <h2 className="font-sans-lg">Procurement Shop</h2>
        <p>Select the Procurement Shop, and the fee rates will be populated in the table below.</p>
        <label className="usa-label" htmlFor="options">
            Procurement Shop
        </label>
        <div className="display-flex flex-align-center margin-top-1">
            <select className="usa-select margin-top-0 width-card-lg" name="options" id="options">
                <option value>- Select -</option>
                <option value="dio">DOI</option>
                <option value="option-b">Option B</option>
                <option value="option-c">Option C</option>
            </select>
            <span className="margin-left-1 text-base-dark font-12px">Fee Rate: 4.8%</span>
        </div>
        <h2 className="font-sans-lg margin-top-3">Budget Line Details</h2>
        <p>
            Complete the information below to create new budget lines. Select Add Budget Line to create multiple budget
            lines.
        </p>
        <div className="grid-row grid-gap">
            <div className="grid-col-4">
                <div className="usa-form-group">
                    <label className="usa-label" htmlFor="bl-description">
                        Description
                    </label>
                    <input className="usa-input" id="bl-description" name="bl-description" type="text" />
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
                    <input className="usa-input" id="bl-amount" name="bl-amount" type="number" />
                </div>
            </div>

            <div className="grid-col-4">Row Three</div>
        </div>

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
