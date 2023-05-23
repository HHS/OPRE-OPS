import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import { StepCreateBudgetLines } from "./StepCreateBudgetLines";
import App from "../../App";
import StepAgreementSuccess from "./StepAgreementSuccess";
import { useSelector } from "react-redux";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

export const CreateAgreement = () => {
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const selectedAgreement = useSelector((state) => state.createAgreement.selected_agreement);
    const selectedProcurementShop = useSelector((state) => state.createAgreement.selected_procurement_shop);
    const budgetLinesAdded = useSelector((state) => state.createAgreement.budget_lines_added);
    return (
        <App>
            <CreateAgreementFlow>
                <StepSelectProject wizardSteps={wizardSteps} />
                <StepCreateAgreement wizardSteps={wizardSteps} />
                <StepCreateBudgetLines
                    wizardSteps={wizardSteps}
                    currentStep={3}
                    selectedResearchProject={selectedResearchProject}
                    selectedAgreement={selectedAgreement}
                    selectedProcurementShop={selectedProcurementShop}
                    budgetLinesAdded={budgetLinesAdded}
                />
                <StepAgreementSuccess />
            </CreateAgreementFlow>
        </App>
    );
};
