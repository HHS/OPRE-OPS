import { useSelector } from "react-redux";
import { ProjectSelect } from "./ProjectSelect";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";

export const StepSelectProject = ({ goToNext, wizardSteps }) => {
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);

    const handleContinue = () => {
        if (selectedResearchProject?.id) {
            goToNext({ project: selectedResearchProject.id });
        }
    };

    return (
        <>
            <h1 className="font-sans-lg">Create New Budget Line</h1>
            <p>Step One: Text explaining this page</p>
            <StepIndicator steps={wizardSteps} currentStep={1} />
            <h2 className="font-sans-lg">Select a Project</h2>
            <p>
                Select the project this budget line should be associated with. If you need to create a new project,
                click Add New Project.
            </p>
            <ProjectSelect />
            <div className="grid-row flex-justify-end margin-top-8">
                <button className="usa-button" onClick={handleContinue} disabled={!selectedResearchProject?.id}>
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
            </div>
        </>
    );
};
