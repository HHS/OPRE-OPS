import StepIndicator from "../../../components/UI/StepIndicator";

const AgreementProcurementTracker = () => {
    const wizardSteps = ["Acquisition Planning", "Pre-Solicitation", "Solicitation", "Evaluation", "Pre-Award", "Award"]

    return (
        <StepIndicator
            steps={wizardSteps}
            currentStep={3}
        />
    );
};

export default AgreementProcurementTracker
