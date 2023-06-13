import CreateBudgetLineFlow from "./CreateBudgetLineFlow";
import StepSelectProjectAndAgreement from "./StepSelectProjectAndAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import StepSuccess from "./StepSuccess";
import { useBudgetLines } from "./budgetLineContext";

export const CreateBudgetLine = () => {
    const {
        wizardSteps,
        selected_project: selectedProject,
        selected_agreement: selectedAgreement,
        selected_procurement_shop: selectedProcurementShop,
        existing_budget_lines: existingBudgetLines,
    } = useBudgetLines();

    return (
        <CreateBudgetLineFlow>
            <StepSelectProjectAndAgreement />
            <StepCreateBudgetLines
                wizardSteps={wizardSteps}
                currentStep={2}
                selectedResearchProject={selectedProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                existingBudgetLines={existingBudgetLines}
                continueBtnText="Create Budget Lines"
            />
            <StepSuccess />
        </CreateBudgetLineFlow>
    );
};

export default CreateBudgetLine;
