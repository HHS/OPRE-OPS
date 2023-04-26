import App from "../../App";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";

export const CreateProject = () => {
    return (
        <App>
            <h1 className="font-sans-lg">Create New Project</h1>
            <p>Step One: Text explaining this page</p>
            <StepIndicator steps={["Project & Agreement", "Budget Lines", "Review"]} currentStep={1} />
            <h2 className="font-sans-lg">Select the Project Type</h2>
            <p>Select the type of project you are creating.</p>
            <div className="usa-combo-box" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select"
                    name="projectType"
                    aria-hidden="true"
                    tabIndex="-1"
                    defaultValue="Research"
                >
                    <option id="Research" value="Research">
                        Research
                    </option>
                </select>
            </div>
            <h2 className="font-sans-lg">Project Details</h2>
            <p>Project Nickname or Acronym</p>
            <p>Project Title</p>
            <p>Description</p>
            <p>Brief Description for internal purposes, not for the OPRE website.</p>
        </App>
    );
};
