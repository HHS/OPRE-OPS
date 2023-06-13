import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import StepAgreementSuccess from "./StepAgreementSuccess";
import { useCreateAgreement } from "./CreateAgreementContext";

export const CreateAgreement = () => {
    const createAgreementContext = useCreateAgreement();

    const {
        wizardSteps,
        selected_project: selectedResearchProject,
        agreement: selectedAgreement,
        selected_procurement_shop: selectedProcurementShop,
    } = createAgreementContext;

    return (
        <CreateAgreementFlow>
            <StepSelectProject />
            <StepCreateAgreement />
            <StepCreateBudgetLines
                wizardSteps={wizardSteps}
                currentStep={3}
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                continueBtnText="Save Draft"
            />
            <StepAgreementSuccess />
        </CreateAgreementFlow>
    );
};

export default CreateAgreement;
