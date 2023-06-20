import { useDispatch } from "react-redux";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import { useCreateAgreement } from "./CreateAgreementContext";
import { setAlert } from "../../components/UI/Alert/alertSlice";

export const CreateAgreement = () => {
    const createAgreementContext = useCreateAgreement();
    const globalDispatch = useDispatch();

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
                continueOverRide={() =>
                    globalDispatch(
                        setAlert({
                            type: "success",
                            heading: "Agreement Draft Saved",
                            message: "The agreement has been successfully saved.",
                            redirectUrl: "/agreements",
                        })
                    )
                }
            />
        </CreateAgreementFlow>
    );
};

export default CreateAgreement;
