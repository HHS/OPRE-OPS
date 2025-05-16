import React from "react";
import { useLocation } from "react-router-dom";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks";
import StepCreateBudgetLinesAndSCs from "../../components/BudgetLineItems/CreateBLIsAndSCs";
import useAlert from "../../hooks/use-alert.hooks";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepCreateAgreement from "./StepCreateAgreement";
import StepSelectProject from "./StepSelectProject";

/**
 * Renders the Create Agreement flow, which consists of several steps.
 * @component
 * @param {Object} props - The component props.
 * @param {import("../../types/BudgetLineTypes").BudgetLine[]} props.budgetLines - An array of existing budget lines.
 * @param {function} [props.setAgreementId] - A function to set the agreement ID.
 *
 * @returns {React.ReactElement} - The rendered component.
 */
export const CreateEditAgreement = ({ budgetLines, setAgreementId = () => {} }) => {
    const WIZARD_MODES = {
        CREATE: "create",
        EDIT: "edit",
        REVIEW: "review"
    };
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isReviewMode, setIsReviewMode] = React.useState(false);
    const createAgreementContext = useEditAgreement();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode") ?? WIZARD_MODES.CREATE;
    const { setAlert } = useAlert();

    // check mode on mount
    React.useEffect(() => {
        switch (mode) {
            // NOTE: Don't think we have a use case for EDIT mode
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

    React.useEffect(() => {
        if (selectedAgreement) {
            setAgreementId(selectedAgreement.id);
        }
    }, [selectedAgreement, setAgreementId]);

    const cancelMessages = {
        isCreatedMode: "Are you sure you want to cancel creating a new agreement? Your progress will not be saved.",
        isEditMode: "Are you sure you want to cancel editing this agreement? Your changes will not be saved.",
        isReviewMode: "Are you sure you want to cancel editing this agreement? Your changes will not be saved."
    };
    let cancelMsg;

    switch (mode) {
        case WIZARD_MODES.EDIT:
            cancelMsg = cancelMessages.isEditMode;
            break;
        case WIZARD_MODES.REVIEW:
            cancelMsg = cancelMessages.isReviewMode;
            break;
        default:
            cancelMsg = cancelMessages.isCreatedMode;
            break;
    }
    const handleFinish = (formData) => {
        console.log("Finished!", formData);
    };

    return (
        <CreateAgreementFlow onFinish={handleFinish}>
            <StepSelectProject
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                selectedAgreementId={selectedAgreement?.id}
                cancelHeading={cancelMsg}
            />
            <StepCreateAgreement
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                selectedAgreementId={selectedAgreement?.id}
                cancelHeading={cancelMsg}
            />
            <StepCreateBudgetLinesAndSCs
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                continueBtnText="Create Agreement"
                budgetLines={budgetLines}
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                workflow="agreement"
                continueOverRide={() =>
                    setAlert({
                        type: "success",
                        heading: `${isReviewMode ? "Errors Resolved" : "Agreement Created"}`,
                        message: `${isReviewMode ? "This agreement has been successfully updated and can now be sent to approval." : `The agreement ${selectedAgreement?.name} has been successfully created.`}`,
                        redirectUrl: `${!isReviewMode ? "/agreements" : `/agreements/review/${selectedAgreement?.id}`}`
                    })
                }
            />
        </CreateAgreementFlow>
    );
};

export default CreateEditAgreement;
