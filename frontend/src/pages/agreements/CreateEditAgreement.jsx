import { useDispatch } from "react-redux";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import { useCreateAgreement } from "./CreateAgreementContext";
import { setAlert } from "../../components/UI/Alert/alertSlice";

/**
 * Renders the Create Agreement flow, which consists of several steps.
 * @param {Object} props - The component props.
 * @param {Array<any>} props.existingBudgetLines - An array of existing budget lines.
 * @param {boolean} [props.isEditMode] - A flag indicating whether the component is in edit mode. - optional
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateAgreement = ({ existingBudgetLines, isEditMode }) => {
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
            <StepSelectProject isEditMode={isEditMode} />
            <StepCreateAgreement isEditMode={isEditMode} />
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
                            heading: "Agreement draft saved",
                            message: "The agreement has been successfully saved.",
                            redirectUrl: "/agreements",
                        })
                    )
                }
                existingBudgetLines={existingBudgetLines}
                isEditMode={isEditMode}
                workflow="agreement"
            />
        </CreateAgreementFlow>
    );
};

export default CreateAgreement;
