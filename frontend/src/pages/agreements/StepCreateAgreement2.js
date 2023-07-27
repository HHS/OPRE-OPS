import StepCreateAgreement from "./StepCreateAgreement";

export const StepCreateAgreement2 = ({ goBack, goToNext, isEditMode, isReviewMode, wizardSteps, currentStep }) => {

    return (
        <StepCreateAgreement
            goBack={goBack} goToNext={goToNext} isEditMode={isEditMode} isReviewMode={isReviewMode}
            wizardSteps={wizardSteps} currentStep={currentStep}
        />
    )
}