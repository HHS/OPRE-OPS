import AgreementEditForm from "../../components/Agreements/AgreementEditor/AgreementEditForm";
import PropTypes from "prop-types";
import EditModeTitle from "./EditModeTitle";
import StepIndicator from "../../components/UI/StepIndicator";
import ProjectSummaryCard from "../../components/ResearchProjects/ProjectSummaryCard/ProjectSummaryCard";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";

export const StepCreateAgreement = ({ goBack, goToNext, isEditMode, isReviewMode, wizardSteps }) => {
    const { selected_project: selectedResearchProject } = useEditAgreement();

    return (
        <>
            <EditModeTitle isEditMode={isEditMode || isReviewMode} />
            <StepIndicator
                steps={wizardSteps}
                currentStep={2}
            />
            <ProjectSummaryCard selectedResearchProject={selectedResearchProject} />
            <AgreementEditForm
                goBack={goBack}
                goToNext={goToNext}
                isReviewMode={isReviewMode}
            />
        </>
    );
};

StepCreateAgreement.propTypes = {
    goBack: PropTypes.func,
    goToNext: PropTypes.func,
    isEditMode: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    wizardSteps: PropTypes.arrayOf(PropTypes.string),
    currentStep: PropTypes.number
};

export default StepCreateAgreement;
