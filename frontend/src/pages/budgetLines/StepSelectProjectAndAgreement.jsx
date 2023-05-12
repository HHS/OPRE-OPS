import React from "react";
import { useDispatch } from "react-redux";
import { useGetResearchProjectsQuery } from "../../api/opsAPI";
import { setAgreements } from "./createBudgetLineSlice";
import { Link } from "react-router-dom";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import ProjectSelect from "../../components/UI/Form/ProjectSelect";
import AgreementSelect from "./AgreementSelect";
import { useBudgetLines } from "./budgetLineContext";
import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";

export const StepSelectProjectAndAgreement = ({ goToNext }) => {
    const dispatch = useDispatch();
    const {
        wizardSteps,
        setSelectedAgreement,
        selectedProject,
        setSelectedProject,
        selectedAgreement,
        setSelectedProcurementShop,
        setBudgetLinesAdded,
    } = useBudgetLines();

    React.useEffect(() => {
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

    const { data: projects, error: errorProjects, isLoading: isLoadingProjects } = useGetResearchProjectsQuery();

    if (isLoadingProjects) {
        return <div>Loading...</div>;
    }
    if (errorProjects) {
        return <div>Oops, an error occurred</div>;
    }

    const clearAgreementState = () => {
        dispatch(setAgreements([]));
        setSelectedAgreement({});
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
            <ProjectSelect
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
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button"
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
                <Link to="/projects/create" className="usa-button usa-button--outline margin-top-6 margin-bottom-6">
                    Add New Project
                </Link>
                <Link to="/agreements/create" className="usa-button usa-button--outline margin-top-6 margin-bottom-6">
                    Add New Agreement
                </Link>
            </div>
        </>
    );
};

export default StepSelectProjectAndAgreement;
