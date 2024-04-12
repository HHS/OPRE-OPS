import React from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import CreateAgreementFlow from "./CreateAgreementFlow";
import StepSelectProject from "./StepSelectProject";
import StepCreateAgreement from "./StepCreateAgreement";
import StepCreateBudgetLinesAndSCs from "../../components/BudgetLineItems/CreateBLIsAndSCs";
import { useEditAgreement } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import StepSuccessAlert from "../../components/UI/Alert/StepSuccessAlert";

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
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isReviewMode, setIsReviewMode] = React.useState(false);
    const createAgreementContext = useEditAgreement();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode") || undefined;

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

    React.useEffect(() => {
        if (selectedAgreement) {
            setAgreementId(selectedAgreement.id);
        }
    }, [selectedAgreement, setAgreementId]);

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
                budgetLines={budgetLines}
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                workflow="agreement"
            />
            <StepSuccessAlert
                heading="Agreement Created"
                message={`The agreement ${selectedAgreement?.name} has been successfully created. You will be redirected to the Agreements page.`}
                link="/agreements"
                delay={2000}
            />
        </CreateAgreementFlow>
    );
};

CreateEditAgreement.propTypes = {
    budgetLines: PropTypes.arrayOf(PropTypes.any),
    setAgreementId: PropTypes.func
};
export default CreateEditAgreement;
