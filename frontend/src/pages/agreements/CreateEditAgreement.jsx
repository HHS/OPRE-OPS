import React from "react";
import { useLocation } from "react-router-dom";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import useAlert from "../../helpers/use-alert";

/**
 * Renders the Create Agreement flow, which consists of several steps.
 * @param {Object} props - The component props.
 * @param {Array<any>} props.existingBudgetLines - An array of existing budget lines.
 *
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateAgreement = ({ existingBudgetLines }) => {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isReviewMode, setIsReviewMode] = React.useState(false);
    const createAgreementContext = useEditAgreement();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode") || undefined;
    const { setAlert } = useAlert();
    // check mode on mount
    React.useEffect(() => {
        switch (mode) {
            case "edit":
                setIsEditMode(true);
                break;
            case "review":
                setIsReviewMode(true);
                break;
            default:
                return;
        }
    }, [mode]);

    const {
        selected_project: selectedResearchProject,
        agreement: selectedAgreement,
        selected_procurement_shop: selectedProcurementShop,
    } = createAgreementContext;

    return (
        <CreateAgreementFlow>
            <StepSelectProject isEditMode={isEditMode} isReviewMode={isReviewMode} />
            <StepCreateAgreement isEditMode={isEditMode} isReviewMode={isReviewMode} />
            <StepCreateBudgetLines
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                continueBtnText="Save Draft"
                continueOverRide={() =>
                    setAlert({
                        type: "success",
                        heading: "Agreement draft saved",
                        message: "The agreement has been successfully saved.",
                        redirectUrl: "/agreements",
                    })
                }
                existingBudgetLines={existingBudgetLines}
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                workflow="agreement"
            />
        </CreateAgreementFlow>
    );
};

export default CreateAgreement;
