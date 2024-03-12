import React from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLinesAndSCs from "../../components/UI/WizardSteps/CreateBLIsAndSCs";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import useAlert from "../../hooks/use-alert.hooks";

/**
 * Renders the Create Agreement flow, which consists of several steps.
 * @param {Object} props - The component props.
 * @param {Array<any>} props.budgetLines - An array of existing budget lines.
 *
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateAgreement = ({ budgetLines }) => {
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
        selected_procurement_shop: selectedProcurementShop
    } = createAgreementContext;

    return (
        <CreateAgreementFlow>
            <StepSelectProject
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                selectedAgreementId={selectedAgreement?.id}
            />
            <StepCreateAgreement
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                selectedAgreementId={selectedAgreement?.id}
            />
            <StepCreateBudgetLinesAndSCs
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                continueBtnText="Create Agreement"
                continueOverRide={() =>
                    setAlert({
                        type: "success",
                        heading: "Agreement Created",
                        message: `The agreement ${selectedAgreement?.name} has been successfully created.`,
                        redirectUrl: "/agreements"
                    })
                }
                budgetLines={budgetLines}
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                workflow="agreement"
            />
        </CreateAgreementFlow>
    );
};

CreateAgreement.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.any)
};
export default CreateAgreement;
