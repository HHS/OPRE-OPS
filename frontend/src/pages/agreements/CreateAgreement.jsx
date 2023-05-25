import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import App from "../../App";
import StepAgreementSuccess from "./StepAgreementSuccess";
import { useSelector } from "react-redux";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

export const CreateAgreement = () => {
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const selectedAgreement = useSelector((state) => state.createAgreement.agreement);
    const selectedProcurementShop = useSelector((state) => state.createAgreement.selected_procurement_shop);
    const existingBudgetLines = useSelector((state) => state.createAgreement.budget_lines_added);
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
                    existingBudgetLines={existingBudgetLines}
                />
                <StepAgreementSuccess />
            </CreateAgreementFlow>
        </App>
    );
};
