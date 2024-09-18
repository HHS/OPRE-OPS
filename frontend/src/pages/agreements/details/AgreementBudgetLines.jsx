import PropTypes from "prop-types";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetServicesComponentsListQuery } from "../../../api/opsAPI";
import AgreementBudgetLinesHeader from "../../../components/Agreements/AgreementBudgetLinesHeader";
import AgreementTotalCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../../../components/Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import { groupByServicesComponent, hasBlIsInReview } from "../../../helpers/budgetLines.helpers";
import { findDescription, findPeriodEnd, findPeriodStart } from "../../../helpers/servicesComponent.helpers";
import { draftBudgetLineStatuses, getCurrentFiscalYear } from "../../../helpers/utils";
import { useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";

/**
 * Renders Agreement budget lines view
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @param {number} props.agreement.id - The agreement id.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {Function} props.setIsEditMode - The function to set the edit mode.
 * @returns {JSX.Element} - The rendered component.
 */
const AgreementBudgetLines = ({ agreement, isEditMode, setIsEditMode }) => {
    // TODO: Create a custom hook for this business logix (./AgreementBudgetLines.hooks.js)
    const navigate = useNavigate();
    const [includeDrafts, setIncludeDrafts] = React.useState(false);
    const doesAgreementHaveBLIsInReview = hasBlIsInReview(agreement?.budget_line_items);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id) && !doesAgreementHaveBLIsInReview;
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);

    // details for AgreementTotalBudgetLinesCard
    const blis = agreement.budget_line_items ?? [];
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

    const agreementTotal = totals.Agreement.total;
    const agreementSubtotal = totals.Agreement.subtotal;
    const agreementFees = totals.Agreement.fees;
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(agreement?.budget_line_items);

    return (
        <>
            {!isEditMode && (
                <>
                    <AgreementBudgetLinesHeader
                        heading="Budget Lines Summary"
                        details="The summary below shows a breakdown of the agreement total."
                        includeDrafts={includeDrafts}
                        setIncludeDrafts={setIncludeDrafts}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        isEditable={canUserEditAgreement}
                    />
                    <div className="display-flex flex-justify">
                        <AgreementTotalCard
                            total={agreementTotal}
                            subtotal={agreementSubtotal}
                            fees={agreementFees}
                            procurementShopAbbr={agreement.procurement_shop?.abbr}
                            procurementShopFee={agreement.procurement_shop?.fee}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={filteredBlis} />
                    </div>
                    <div className="margin-y-3">
                        <h2 className="font-sans-lg">Budget Lines</h2>
                        <p className="font-sans-sm">
                            This is a list of all services components and budget lines within this agreement.
                        </p>
                    </div>
                </>
            )}

            {isEditMode && (
                <CreateBLIsAndSCs
                    selectedAgreement={agreement}
                    budgetLines={agreement?.budget_line_items}
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
                    includeDrafts={includeDrafts}
                    setIncludeDrafts={setIncludeDrafts}
                    goBack={() => {
                        setIsEditMode(false);
                        navigate(`/agreements/${agreement.id}/budget-lines`);
                    }}
                />
            )}

            {!isEditMode &&
                groupedBudgetLinesByServicesComponent.length > 0 &&
                groupedBudgetLinesByServicesComponent.map((group) => (
                    <ServicesComponentAccordion
                        key={group.servicesComponentId}
                        servicesComponentId={group.servicesComponentId}
                        withMetadata={true}
                        periodStart={findPeriodStart(servicesComponents, group.servicesComponentId)}
                        periodEnd={findPeriodEnd(servicesComponents, group.servicesComponentId)}
                        description={findDescription(servicesComponents, group.servicesComponentId)}
                    >
                        <BudgetLinesTable
                            budgetLines={group.budgetLines}
                            readOnly={true}
                        />
                    </ServicesComponentAccordion>
                ))}

            {!isEditMode && groupedBudgetLinesByServicesComponent.length === 0 && (
                <p className="text-center">You have not added any Budget Lines yet.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    {canUserEditAgreement ? (
                        <Link
                            className="usa-button margin-top-4 margin-right-0"
                            to={`/agreements/review/${agreement?.id}`}
                            data-cy="bli-tab-continue-btn"
                        >
                            Plan or Execute Budget Lines
                        </Link>
                    ) : (
                        <Tooltip label="Only team members on this agreement can send to approval">
                            <span
                                className="usa-button margin-top-4 margin-right-0 usa-button--disabled"
                                aria-disabled="true"
                            >
                                Plan or Execute Budget Lines
                            </span>
                        </Tooltip>
                    )}
                </div>
            )}
        </>
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
