import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    useGetServicesComponentsListQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetPortfolioByIdQuery,
    useLazyGetProcurementShopsQuery,
    useLazyGetServicesComponentByIdQuery } from "../../../api/opsAPI";
import AgreementBudgetLinesHeader from "../../../components/Agreements/AgreementBudgetLinesHeader";
import AgreementTotalCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../../../components/Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import { USER_ROLES } from "../../../components/Users/User.constants";
import {
    calculateAgreementTotal,
    getAgreementFeesFromBackend,
    getAgreementSubTotal
} from "../../../helpers/agreement.helpers";
import {
    areAllBudgetLinesInReview,
    calculateProcShopFeePercentage,
    groupByServicesComponent
} from "../../../helpers/budgetLines.helpers";
import { findDescription, findPeriodEnd, findPeriodStart } from "../../../helpers/servicesComponent.helpers";
import { draftBudgetLineStatuses, getCurrentFiscalYear } from "../../../helpers/utils";
import { useIsUserOfRoleType } from "../../../hooks/user.hooks";
import {handleExport} from "../../../helpers/budgetLines.helpers";
import {exportTableToXlsx} from "../../../helpers/tableExport.helpers.js";
import PacmanLoader from "react-spinners/PacmanLoader";
import icons from "../../../uswds/img/sprite.svg";

/**
 * Renders Agreement budget lines view
 * @component
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {boolean} props.isAgreementNotaContract - Whether the agreement is not a contract.
 * @param {boolean} props.isAgreementAwarded - Whether the agreement is awarded.
 * @param {Function} props.setIsEditMode - The function to set the edit mode.
 * @returns {JSX.Element} - The rendered component.
 */
const AgreementBudgetLines = ({
    agreement,
    isEditMode,
    setIsEditMode,
    isAgreementNotaContract,
    isAgreementAwarded
}) => {
    // TODO: Create a custom hook for this business logix (./AgreementBudgetLines.hooks.js)
    const navigate = useNavigate();
    const [isExporting, setIsExporting] = React.useState(false);

    const [includeDrafts, setIncludeDrafts] = React.useState(false);
    const isSuperUser = useIsUserOfRoleType(USER_ROLES.SUPER_USER);
    const canUserEditAgreement = isSuperUser || (agreement?._meta.isEditable && !isAgreementNotaContract);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);
    const allBudgetLinesInReview = areAllBudgetLinesInReview(agreement?.budget_line_items ?? []);
    const filters = { agreementIds: [agreement?.id] };

    // details for AgreementTotalBudgetLinesCard
    let blis = agreement?.budget_line_items ?? [];
    const filteredBlis = includeDrafts ? blis : blis.filter((bli) => !draftBudgetLineStatuses.includes(bli.status));
    const currentFiscalYear = getCurrentFiscalYear();

    const toolTipLabel = () => {
        switch (true) {
            case isAgreementNotaContract:
                return "Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) \nor direct obligations have not been developed yet, but are coming soon.";
            case allBudgetLinesInReview:
                return "Budget lines In Review Status cannot be sent for status changes";
            default:
                return "Only team members on this agreement can send to approval";
        }
    };

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
        let amount = bl?.amount ?? 0;
        let feePercentage = calculateProcShopFeePercentage(bl, agreement?.procurement_shop?.fee_percentage) / 100;
        let fee = amount * feePercentage;
        let total = amount + fee;
        let status = bl?.status?.charAt(0).toUpperCase() + bl?.status?.slice(1).toLowerCase();

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

    // Use backend-calculated fees for displaying current agreement totals
    const agreementTotal = calculateAgreementTotal(agreement?.budget_line_items ?? [], null, includeDrafts);
    const agreementSubtotal = includeDrafts
        ? agreement.budget_line_items?.reduce((n, { amount }) => n + amount, 0) || 0
        : getAgreementSubTotal(agreement);
    const agreementFees = getAgreementFeesFromBackend(agreement, includeDrafts);

    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(agreement?.budget_line_items ?? []);


    const [serviceComponentTrigger] = useLazyGetServicesComponentByIdQuery();
    const [budgetLineTrigger] = useLazyGetBudgetLineItemsQuery();
    const [procShopTrigger] = useLazyGetProcurementShopsQuery();
    const [portfolioTrigger] = useLazyGetPortfolioByIdQuery();

    if (isExporting) {
        return (
            <div
                className="bg-white display-flex flex-column flex-align-center flex-justify-center padding-y-4 height-viewport">
                <h1 className="margin-bottom-2">Exporting...</h1>
                <PacmanLoader
                    size={25}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            </div>
        );
    }
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
                        />
                        <BLIsByFYSummaryCard budgetLineItems={filteredBlis} />
                    </div>
                    <div className="margin-y-3">
                        <h2 className="font-sans-lg">Budget Lines</h2>
                        <p className="font-sans-sm">
                            This is a list of all services components and budget lines within this agreement.
                        </p>
                    </div>
                    <div>
                        {blis && blis?.length > 0 && (
                            <button
                                style={{fontSize: "16px"}}
                                className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                                data-cy="budget-line-export"
                                onClick={() => handleExport(exportTableToXlsx, setIsExporting,
                                    filters, blis, budgetLineTrigger, procShopTrigger,
                                    serviceComponentTrigger, portfolioTrigger, blis.length)}
                            >
                                <svg
                                    className={`height-2 width-2 margin-right-05`}
                                    style={{fill: "#005EA2", height: "24px", width: "24px"}}
                                >
                                    <use href={`${icons}#save_alt`}></use>
                                </svg>
                                <span>Export</span>
                            </button>
                        )}
                    </div>
                </>
            )}

            {isEditMode && (
                <CreateBLIsAndSCs
                    selectedAgreement={agreement}
                    budgetLines={agreement?.budget_line_items ?? []}
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
                            isAgreementAwarded={isAgreementAwarded}
                            readOnly={true}
                            isEditable={agreement?._meta.isEditable}
                            agreementProcShopFeePercentage={agreement?.procurement_shop?.fee_percentage}
                        />
                    </ServicesComponentAccordion>
                ))}

            {!isEditMode && groupedBudgetLinesByServicesComponent.length === 0 && (
                <p className="text-center">You have not added any Budget Lines yet.</p>
            )}

            {!isEditMode && (
                <div className="grid-row flex-justify-end margin-top-1">
                    {canUserEditAgreement && !isAgreementNotaContract && !allBudgetLinesInReview ? (
                        <Link
                            className="usa-button margin-top-4 margin-right-0"
                            to={`/agreements/review/${agreement?.id}`}
                            data-cy="bli-continue-btn"
                        >
                            Request BL Status Change
                        </Link>
                    ) : (
                        <Tooltip label={toolTipLabel()}>
                            <span
                                className={"usa-button margin-top-4 margin-right-0 usa-button--disabled"}
                                aria-disabled="true"
                                data-cy="bli-continue-btn-disabled"
                            >
                                Request BL Status Change
                            </span>
                        </Tooltip>
                    )}
                </div>
            )}
        </>
    );
};

export default AgreementBudgetLines;
