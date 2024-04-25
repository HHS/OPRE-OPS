import { useGetResearchProjectsQuery, useGetAgreementsByResearchProjectFilterQuery } from "../../api/opsAPI";
import { Link } from "react-router-dom";
import StepIndicator from "../../components/UI/StepIndicator";
import ProjectSelectWithSummaryCard from "../../components/Projects/ProjectSelectWithSummaryCard";
import AgreementSelect from "../../components/Agreements/AgreementSelect";
import { useBudgetLines, useSetState } from "./BudgetLineContext.hooks";

export const StepSelectProjectAndAgreement = ({ goToNext }) => {
    const { wizardSteps, selected_project: selectedProject, selected_agreement: selectedAgreement } = useBudgetLines();
    // setters
    const setSelectedProject = useSetState("selected_project");
    const setSelectedAgreement = useSetState("selected_agreement");
    const setSelectedProcurementShop = useSetState("selected_procurement_shop");
    const setBudgetLinesAdded = useSetState("existing_budget_lines");
    const setAgreements = useSetState("agreements");

    const { data: projects, error: errorProjects, isLoading: isLoadingProjects } = useGetResearchProjectsQuery();
    const {
        data: agreements,
        error: errorAgreements,
        isLoading: isLoadingAgreements
    } = useGetAgreementsByResearchProjectFilterQuery(selectedProject?.id, { skip: !selectedProject?.id });

    if (isLoadingProjects) {
        return <div>Loading...</div>;
    }
    if (errorProjects) {
        return <div>Oops, an error occurred</div>;
    }
    // get agreements by selected project

    if (isLoadingAgreements) {
        return <div>Loading...</div>;
    }
    if (errorAgreements) {
        return <div>Oops, an error occurred</div>;
    }

    const clearAgreementState = () => {
        setSelectedAgreement(0);
        setAgreements([]);
    };

    return (
        <>
            <h1 className="font-sans-lg">Create New Budget Line</h1>
            <p>Step One: Text explaining this page</p>
            <StepIndicator
                steps={wizardSteps}
                currentStep={1}
            />
            <h2 className="font-sans-lg">Select a Project</h2>
            <p>
                Select the project this budget line should be associated with. If you need to create a new project,
                click Add New Project.
            </p>
            <ProjectSelectWithSummaryCard
                researchProjects={projects}
                selectedResearchProject={selectedProject}
                setSelectedProject={setSelectedProject}
                clearFunction={clearAgreementState}
            />
            <h2 className="font-sans-lg">Select an Agreement</h2>
            <p>Select the project and agreement this budget line should be associated with.</p>
            <AgreementSelect
                selectedProject={selectedProject}
                selectedAgreement={selectedAgreement}
                setSelectedAgreement={setSelectedAgreement}
                setSelectedProcurementShop={setSelectedProcurementShop}
                setBudgetLinesAdded={setBudgetLinesAdded}
                agreements={agreements}
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button"
                    data-cy="continue-button-step-one"
                    onClick={() => goToNext()}
                    // disable if no project or agreement is selected
                    disabled={!(selectedProject?.id && selectedAgreement?.id)}
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
                <Link
                    to="/projects/create"
                    className="usa-button usa-button--outline margin-top-6 margin-bottom-6"
                >
                    Add New Project
                </Link>
                <Link
                    to="/agreements/create"
                    className="usa-button usa-button--outline margin-top-6 margin-bottom-6"
                >
                    Add New Agreement
                </Link>
            </div>
        </>
    );
};

export default StepSelectProjectAndAgreement;
