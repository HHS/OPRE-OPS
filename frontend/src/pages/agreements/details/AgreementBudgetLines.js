import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import AgreementDetailHeader from "../../../components/Agreements/AgreementDetailHeader";
import { CreateBudgetLinesProvider } from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import StepCreateBudgetLines from "../../../components/UI/WizardSteps/StepCreateBudgetLines/StepCreateBudgetLines";
import { useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import { useState } from "react";
import AgreementBudgetLinesHeader from "../../../components/Agreements/AgreementBudgetLinesHeader";
import { draftBudgetLineStatuses, getCurrentFiscalYear } from "../../../helpers/utils";
import BLIsByFYSummaryCard from "../../../components/Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import AgreementTotalCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalCard";
import { hasActiveWorkflow } from "../../../helpers/budgetLines.helpers";

/**
 * Renders Agreement budget lines view
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @param {number} props.agreement.id - The agreement id.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement, isEditMode, setIsEditMode }) => {
    const navigate = useNavigate();
    const [includeDrafts, setIncludeDrafts] = useState(false);
    const doesAgreementHaveActiveWorkflow = hasActiveWorkflow(agreement?.budget_line_items);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id) && !doesAgreementHaveActiveWorkflow;
    const { setAlert } = useAlert();

    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    // details for AgreementTotalBudgetLinesCard
    const blis = agreement.budget_line_items ? agreement.budget_line_items : [];
    const filteredBlis = includeDrafts ? blis : blis.filter((bli) => !draftBudgetLineStatuses.includes(bli.status));
    const currentFiscalYear = getCurrentFiscalYear();

    const totals = {
        Draft: { subtotal: 0, fees: 0, total: 0 },
        FY: { subtotal: 0, fees: 0, total: 0 },
        Agreement: { subtotal: 0, fees: 0, total: 0 }
    };

    filteredBlis.forEach((bl) => {
        let date_needed = new Date(bl?.date_needed);
        let month = date_needed.getMonth();
        let year = date_needed.getFullYear();
        let fiscalYear = month > 8 ? year + 1 : year;
        let amount = bl?.amount;
        let fee = amount * bl?.proc_shop_fee_percentage;
        let total = amount + fee;
        let status = bl?.status.charAt(0).toUpperCase() + bl?.status.slice(1).toLowerCase();

        if (status === "Draft") {
            totals["Draft"]["subtotal"] += amount;
            totals["Draft"]["fees"] += fee;
            totals["Draft"]["total"] += total;
        }

        if (fiscalYear === +currentFiscalYear) {
            totals["FY"]["subtotal"] += amount;
            totals["FY"]["fees"] += fee;
            totals["FY"]["total"] += total;
        }

        totals["Agreement"]["subtotal"] += amount;
        totals["Agreement"]["fees"] += fee;
        totals["Agreement"]["total"] += total;
    });

    // if there are no BLIS than the user can edit
    if (agreement?.budget_line_items?.length === 0) {
        setIsEditMode(true);
    }

    return (
        <CreateBudgetLinesProvider>
            <AgreementBudgetLinesHeader
                heading="Budget Lines Summary"
                details="The summary below shows a breakdown of all budget lines within this agreement."
                includeDrafts={includeDrafts}
                setIncludeDrafts={setIncludeDrafts}
            />
            <div className="display-flex flex-justify">
                <BLIsByFYSummaryCard budgetLineItems={filteredBlis} />
                <AgreementTotalCard
                    total={totals["Agreement"]["total"]}
                    subtotal={totals["Agreement"]["subtotal"]}
                    fees={totals["Agreement"]["fees"]}
                    procurementShop={agreement.procurement_shop}
                />
            </div>
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={canUserEditAgreement}
            />
            {isEditMode ? (
                <StepCreateBudgetLines
                    selectedAgreement={agreement}
                    existingBudgetLines={agreement?.budget_line_items}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    isReviewMode={false}
                    selectedProcurementShop={agreement?.procurement_shop}
                    selectedResearchProject={agreement?.project}
                    canUserEditBudgetLines={canUserEditAgreement}
                    wizardSteps={[]}
                    continueBtnText="Save Changes"
                    currentStep={0}
                    workflow="none"
                    goBack={() => {
                        setIsEditMode(false);
                        navigate(`/agreements/${agreement.id}/budget-lines`);
                    }}
                    continueOverRide={() => {
                        setAlert({
                            type: "success",
                            heading: "Budget Lines Saved",
                            message: "The budget lines have been successfully saved.",
                            navigateUrl: navigate(-1)
                        });
                    }}
                />
            ) : agreement?.budget_line_items.length > 0 ? (
                <BudgetLinesTable
                    budgetLinesAdded={agreement?.budget_line_items}
                    readOnly={!isEditMode}
                    showTotalSummaryCard={false}
                />
            ) : (
                <p>No budget lines.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    <Link
                        className="usa-button margin-top-4 margin-right-0"
                        to={`/agreements/review/${agreement?.id}`}
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
        project: PropTypes.object,
        team_members: PropTypes.arrayOf(PropTypes.object),
        created_by: PropTypes.number,
        project_officer_id: PropTypes.number
    }),
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func
};

export default AgreementBudgetLines;
