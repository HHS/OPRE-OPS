import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { useNavigate } from "react-router-dom";
import { BLI_STATUS, hasAnyBliInSelectedStatus } from "../../../helpers/budgetLines.helpers";

/**
 * Renders the edit-mode of an agreement
 * @param {object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display details for.
 * @param {function} props.setHasAgreementChanged - The function to set the agreement changed state.
 * @param {object} props.projectOfficer - The project officer object for the agreement.
 * @param {object} props.alternateProjectOfficer - The alternate project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetailsEdit = ({
    agreement,
    setHasAgreementChanged,
    projectOfficer,
    alternateProjectOfficer,
    isEditMode,
    setIsEditMode
}) => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const goToNext = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const isReviewMode = false;
    const isAgreementAwarded =
        hasAnyBliInSelectedStatus(agreement.budget_line_items ?? [], BLI_STATUS.OBLIGATED) ||
        hasAnyBliInSelectedStatus(agreement.budget_line_items ?? [], BLI_STATUS.EXECUTING);
    const areAnyBudgetLinesPlanned = hasAnyBliInSelectedStatus(agreement.budget_line_items ?? [], BLI_STATUS.PLANNED);

    return (
        <div>
            <EditAgreementProvider
                agreement={agreement}
                projectOfficer={projectOfficer}
                alternateProjectOfficer={alternateProjectOfficer}
            >
                <AgreementEditForm
                    setHasAgreementChanged={setHasAgreementChanged}
                    goBack={goBack}
                    goToNext={goToNext}
                    isReviewMode={isReviewMode}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    isAgreementAwarded={isAgreementAwarded}
                    areAnyBudgetLinesPlanned={areAnyBudgetLinesPlanned}
                />
            </EditAgreementProvider>
        </div>
    );
};

export default AgreementDetailsEdit;
