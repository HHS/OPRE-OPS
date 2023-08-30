import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AgreementDetailHeader from "./AgreementDetailHeader";
import { CreateBudgetLinesProvider } from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";
import BudgetLinesTable from "../../../components/UI/BudgetLinesTable";
import StepCreateBudgetLines from "../../../components/UI/WizardSteps/StepCreateBudgetLines/StepCreateBudgetLines";
import Alert from "../../../components/UI/Alert";

/**
 * Renders Agreement budget lines view
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement, isEditMode, setIsEditMode }) => {
    const navigate = useNavigate();
    const isGlobalAlertActive = useSelector((state) => state.alert.isActive);

    // Checks for who can edit budget lines
    const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);
    const isUserAgreementCreator = agreement?.created_by === loggedInUserId;
    const isUserTheProjectOfficer = agreement?.project_officer === loggedInUserId;
    const isUserOnAgreementTeam = agreement?.team_members?.some((member) => member.id === loggedInUserId);
    const isUserCreatorOfAnyBudgetLines = agreement?.budget_line_items?.some(
        (bli) => bli.created_by === loggedInUserId
    );
    // TODO: add check if user is on the Budget Team
    const canUserEditBudgetLines =
        isUserAgreementCreator || isUserTheProjectOfficer || isUserOnAgreementTeam || isUserCreatorOfAnyBudgetLines;

    // if there are no BLIS than the user can edit
    if (agreement?.budget_line_items?.length === 0) {
        setIsEditMode(true);
    }

    return (
        <CreateBudgetLinesProvider>
            {!isEditMode && isGlobalAlertActive && <Alert />}
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={canUserEditBudgetLines}
            />
            {isEditMode ? (
                <StepCreateBudgetLines
                    selectedAgreement={agreement}
                    existingBudgetLines={agreement?.budget_line_items}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    isReviewMode={false}
                    selectedProcurementShop={agreement?.procurement_shop}
                    selectedResearchProject={agreement?.research_project}
                    canUserEditBudgetLines={canUserEditBudgetLines}
                    wizardSteps={[]}
                    continueBtnText="Save Changes"
                    currentStep={0}
                    workflow="none"
                    goBack={() => {
                        setIsEditMode(false);
                        navigate(`/agreements/${agreement.id}/budget-lines`);
                    }}
                    continueOverRide={() => {
                        navigate(`/agreements/${agreement.id}/budget-lines`);
                    }}
                />
            ) : agreement?.budget_line_items.length > 0 ? (
                <BudgetLinesTable budgetLinesAdded={agreement?.budget_line_items} readOnly={!isEditMode} />
            ) : (
                <p>No budget lines.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    <Link
                        className="usa-button margin-top-4 margin-right-0"
                        to={`/agreements/approve/${agreement?.id}`}
                        data-cy="bli-tab-continue-btn"
                    >
                        Plan or Execute Budget Lines
                    </Link>
                </div>
            )}
        </CreateBudgetLinesProvider>
    );
};

AgreementBudgetLines.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number,
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
        procurement_shop: PropTypes.object,
        research_project: PropTypes.object,
        team_members: PropTypes.arrayOf(PropTypes.object),
        created_by: PropTypes.number,
        project_officer: PropTypes.number,
    }),
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
};

export default AgreementBudgetLines;
