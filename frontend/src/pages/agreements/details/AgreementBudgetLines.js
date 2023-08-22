import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import AgreementDetailHeader from "./AgreementDetailHeader";
import { CreateBudgetLinesProvider } from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";
import StepCreateBudgetLines from "../../../components/UI/WizardSteps/StepCreateBudgetLines/StepCreateBudgetLines";
import Alert from "../../../components/UI/Alert";
import { setAlert } from "../../../components/UI/Alert/alertSlice";

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
    const globalDispatch = useDispatch();
    const isGlobalAlertActive = useSelector((state) => state.alert.isActive);

    return (
        <CreateBudgetLinesProvider>
            {!isEditMode && isGlobalAlertActive && <Alert />}
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={true}
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
                        globalDispatch(
                            setAlert({
                                type: "success",
                                heading: "Budget Lines updated",
                                message: "The budget lines have been successfully updated.",
                            })
                        );
                    }}
                />
            ) : agreement?.budget_line_items.length > 0 ? (
                <PreviewTable budgetLinesAdded={agreement?.budget_line_items} readOnly={!isEditMode} />
            ) : (
                <p>No budget lines.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    <Link
                        className="usa-button margin-top-4 margin-right-0"
                        to={`/agreements/approve/${agreement?.id}`}
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
    }),
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
};

export default AgreementBudgetLines;
