import StepIndicator from "../../../components/UI/StepIndicator";

const AgreementProcurementTracker = () => {
    //The data within currentStep will be provided by the backend.
    const wizardSteps = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];
    const currentStep = 2;

    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">Procurement Tracker</h2>
            </div>
            <p className="font-sans-sm margin-bottom-4">
                Follow the steps below to complete the procurement process for Budget Lines in Executing Status.
            </p>

            <StepIndicator
                steps={wizardSteps}
                currentStep={currentStep}
            />
            {/* Accordions */}
        </>
    );
};

export default AgreementProcurementTracker;
