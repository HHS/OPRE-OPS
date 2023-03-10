import App from "../../App";
import { StepIndicatorOne } from "../../components/UI/StepIndicator/StepIndicatorOne";
import { StepIndicatorTwo } from "../../components/UI/StepIndicator/StepIndicatorTwo";
import { StepIndicatorThree } from "../../components/UI/StepIndicator/StepIndicatorThree";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import { ProjectSelect } from "./ProjectSelect";

const StepOne = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step One</p>
        <StepIndicatorOne />
        <h2 className="font-sans-lg">Select a Project or Create a New One</h2>
        <p>
            Select the project this budget line should be associated with. If you need to create a new project, click
            Add New Project.
        </p>
        <ProjectSelect />
        <div className="grid-row">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ name: "John Doe" })}>
                Continue
            </button>
        </div>
    </>
);
const StepTwo = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Two</p>
        <StepIndicatorTwo />
        <div className="float-right">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ age: 100 })}>
                Continue
            </button>
        </div>
    </>
);
const StepThree = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Three</p>
        <StepIndicatorThree />
        <div className="float-right">
            <button className="usa-button usa-button--outline" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext({ hairColor: "brown" })}>
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
