import AgreementEditForm from "../../components/Agreements/AgreementEditor/AgreementEditForm";
import PropTypes from "prop-types";
import EditModeTitle from "./EditModeTitle";
import StepIndicator from "../../components/UI/StepIndicator";
import ProjectSummaryCard from "../../components/Projects/ProjectSummaryCard/ProjectSummaryCard";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks";

/**
 * StepCreateAgreement is a component that represents a step in a wizard for creating or editing an agreement.
 * It displays the title of the mode (edit or review), a step indicator, a summary of the selected research project, and an agreement edit form.
 * @component
 * @param {Object} props - The properties passed to this component.
 * @param {function} props.goBack - The function to go back to the previous step.
 * @param {function} props.goToNext - The function to go to the next step.
 * @param {boolean} props.isEditMode - Indicates if the wizard is in edit mode.
 * @param {boolean} props.isReviewMode - Indicates if the wizard is in review mode.
 * @param {Array.<string>} props.wizardSteps - The steps of the wizard.
 * @param {number} props.selectedAgreementId - The ID of the selected agreement.
 * @param {string} props.cancelHeading - The heading for the cancel modal.
 * @returns {JSX.Element} The rendered StepCreateAgreement component.
 */
const StepCreateAgreement = ({
    goBack,
    goToNext,
    isEditMode,
    isReviewMode,
    wizardSteps,
    selectedAgreementId,
    cancelHeading
}) => {
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
                selectedAgreementId={selectedAgreementId}
                cancelHeading={cancelHeading}
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
    currentStep: PropTypes.number,
    selectedAgreementId: PropTypes.number,
    cancelHeading: PropTypes.string
};

export default StepCreateAgreement;
