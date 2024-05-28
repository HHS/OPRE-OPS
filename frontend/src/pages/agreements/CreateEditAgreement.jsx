import React from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLinesAndSCs from "../../components/BudgetLineItems/CreateBLIsAndSCs";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks";
import useAlert from "../../hooks/use-alert.hooks";

/**
 * Renders the Create Agreement flow, which consists of several steps.
 * @component
 * @param {Object} props - The component props.
 * @param {Array<any>} props.budgetLines - An array of existing budget lines.
 * @param {function} [props.setAgreementId] - A function to set the agreement ID.
 *
 * @returns {JSX.Element} - The rendered component.
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
                        heading: "Agreement Created",
                        message: `The agreement ${selectedAgreement?.name} has been successfully created.`,
                        redirectUrl: "/agreements"
                    })
                }
            />
        </CreateAgreementFlow>
    );
};

CreateEditAgreement.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.any),
    setAgreementId: PropTypes.func
};
export default CreateEditAgreement;
