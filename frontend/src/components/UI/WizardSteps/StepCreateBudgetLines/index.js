import StepCreateBudgetLines from "./StepCreateBudgetLines";
import { CreateBudgetLinesProvider } from "./context";

const CreateBudgetLines = ({
    goToNext,
    goBack,
    wizardSteps,
    selectedResearchProject,
    selectedAgreement,
    selectedProcurementShop,
    budgetLinesAdded,
}) => {
    return (
        <CreateBudgetLinesProvider>
            <StepCreateBudgetLines
                goToNext={goToNext}
                goBack={goBack}
                wizardSteps={wizardSteps}
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                budgetLinesAdded={budgetLinesAdded}
            />
        </CreateBudgetLinesProvider>
    );
};

export default CreateBudgetLines;
