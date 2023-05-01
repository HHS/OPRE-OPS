import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProjectSelect from "./ProjectSelect";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import { useGetResearchProjectsQuery } from "../../api/opsAPI";

export const StepSelectProject = ({ goToNext, wizardSteps }) => {
    const navigate = useNavigate();
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const { data: projects, error: errorProjects, isLoading: isLoadingProjects } = useGetResearchProjectsQuery();

    if (isLoadingProjects) {
        return <div>Loading...</div>;
    }
    if (errorProjects) {
        return <div>Oops, an error occurred</div>;
    }

    const handleContinue = () => {
        if (selectedResearchProject?.id) {
            goToNext({ project: selectedResearchProject.id });
        }
    };

    const handleAddProject = () => {
        navigate("/projects/create");
    };

    return (
        <>
            <h1 className="font-sans-lg">Create New Agreement</h1>
            <p>Follow the steps to create an Agreement</p>
            <StepIndicator steps={wizardSteps} currentStep={1} />
            <h2 className="font-sans-lg">Select a Project</h2>
            <p>Select the project the Agreement should be associated with.</p>
            <ProjectSelect projectsList={projects} />
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
                <button
                    className="usa-button usa-button--outline margin-top-6 margin-bottom-6"
                    onClick={handleAddProject}
                >
                    Add New Project
                </button>
            </div>
        </>
    );
};
