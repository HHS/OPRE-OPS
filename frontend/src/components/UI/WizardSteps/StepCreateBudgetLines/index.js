import StepCreateBudgetLines from "./StepCreateBudgetLines";
import { CreateBudgetLinesProvider } from "./context";

const CreateBudgetLines = ({
    wizardSteps,
    selectedProject,
    selectedAgreement,
    selectedProcurementShop,
    budgetLinesAdded,
}) => {
    return (
        <CreateBudgetLinesProvider>
            <StepCreateBudgetLines
                wizardSteps={wizardSteps}
                selectedResearchProject={selectedProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                budgetLinesAdded={budgetLinesAdded}
            />
        </CreateBudgetLinesProvider>
    );
};

export default CreateBudgetLines;
