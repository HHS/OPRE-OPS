import CreateBudgetLineFlow from "./CreateBudgetLineFlow";
import StepSelectProjectAndAgreement from "./StepSelectProjectAndAgreement";
import StepCreateBudgetLines from "../../components/BudgetLineItems/CreateBLIsAndSCs";
import StepSuccessAlert from "../../components/UI/Alert/StepSuccessAlert";
import { useBudgetLines } from "./BudgetLineContext.hooks";

export const CreateBudgetLine = () => {
    const {
        wizardSteps,
        selected_project: selectedProject,
        selected_agreement: selectedAgreement,
        selected_procurement_shop: selectedProcurementShop,
        existing_budget_lines: existingBudgetLines
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
                budgetLines={existingBudgetLines}
                continueBtnText="Create Budget Lines"
            />
            <StepSuccessAlert
                heading="Budget Lines Created"
                message="The budget lines have been successfully created. You will be redirected to the Agreements list page."
                link="/agreements"
            />
        </CreateBudgetLineFlow>
    );
};

export default CreateBudgetLine;
