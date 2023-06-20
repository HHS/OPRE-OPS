import StepCreateBudgetLines from "./StepCreateBudgetLines";
import { CreateBudgetLinesProvider } from "./context";

const CreateBudgetLines = ({
    goToNext,
    goBack,
    wizardSteps,
    currentStep,
    selectedResearchProject,
    selectedAgreement,
    selectedProcurementShop,
    existingBudgetLines,
    continueBtnText,
    continueOverRide,
}) => {
    return (
        <CreateBudgetLinesProvider>
            <StepCreateBudgetLines
                goToNext={goToNext}
                goBack={goBack}
                wizardSteps={wizardSteps}
                currentStep={currentStep}
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                existingBudgetLines={existingBudgetLines}
                continueBtnText={continueBtnText}
                continueOverRide={continueOverRide}
            />
        </CreateBudgetLinesProvider>
    );
};

export default CreateBudgetLines;
