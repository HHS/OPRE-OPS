import * as React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAncestryForChildren, useTrailNavigate } from "../../../hooks/useBreadcrumbTrail.hooks";
import { buildTrailState, LIST_CRUMBS } from "../../../helpers/breadcrumb.helpers";
import {
    useGetGrantNumbersListQuery,
    useGetServicesComponentsListQuery,
    useGetVersionQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetPortfolioByIdQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AgreementBudgetLinesHeader from "../../../components/Agreements/AgreementBudgetLinesHeader";
import AgreementTotalCard from "../../../components/Agreements/AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../../../components/Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import BudgetLinesTable from "../../../components/BudgetLineItems/BudgetLinesTable";
import BudgetLinesTableLoading from "../../../components/BudgetLineItems/BudgetLinesTable/BudgetLinesTableLoading";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import GrantNumberAccordion from "../../../components/GrantNumbers/GrantNumberAccordion";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import DisabledButtonWithTooltip from "../../../components/UI/Button/DisabledButtonWithTooltip";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import Tooltip from "../../../components/UI/USWDS/Tooltip";
import {
    calculateAgreementTotal,
    EDIT_DISABLED_TOOLTIPS,
    getAgreementFeesFromBackend,
    getAgreementSubTotal
} from "../../../helpers/agreement.helpers";
import {
    areAllBudgetLinesInReview,
    calculateProcShopFeePercentage,
    findGrantDescription,
    findGrantee,
    findGrantOrganizationType,
    findGrantPeriodEnd,
    findGrantPeriodStart,
    findGrantState,
    groupByGrantNumber,
    groupByServicesComponent
} from "../../../helpers/budgetLines.helpers";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../helpers/servicesComponent.helpers";
import { draftBudgetLineStatuses, getCurrentFiscalYear } from "../../../helpers/utils";
import { anyBudgetLinesByStatus } from "../review/ReviewAgreement.helpers";
import { AgreementType } from "../agreements.constants";
import { useIsUserSuperUser, useCanEditByRole } from "../../../hooks/user.hooks";
import { handleExport } from "../../../helpers/budgetLines.helpers";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers.js";
import { PacmanLoader } from "react-spinners";
import icons from "../../../uswds/img/sprite.svg";

/**
 * Whether any query or mutation in the opsApi slice is in flight.
 * @param {Object} state - The Redux state.
 * @returns {boolean}
 */
const selectIsAnyOpsApiRequestPending = (state) =>
    Object.values(state.opsApi?.queries ?? {}).some((query) => query?.status === "pending") ||
    Object.values(state.opsApi?.mutations ?? {}).some((mutation) => mutation?.status === "pending");

/**
 * Renders Agreement budget lines view
 * @component
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {boolean} props.isAgreementNotDeveloped - Whether the agreement is not yet developed.
 * @param {boolean} props.isAgreementAwarded - Whether the agreement is awarded.
 * @param {boolean} [props.isPreAwardInReview] - if the agreement is in review for pre-award approval
 * @param {boolean} [props.isAwardInReview] - if the agreement is in review for award approval
 * @param {boolean} [props.isPostPreAwardLocked] - if the agreement is permanently locked after full pre-award approval
 * @param {boolean} [props.isAgreementFetching] - Whether the agreement query is (re)fetching, e.g. right after a save.
 * @param {Function} props.setIsEditMode - The function to set the edit mode.
 * @returns {JSX.Element} - The rendered component.
 */
const AgreementBudgetLines = ({
    agreement,
    isEditMode,
    setIsEditMode,
    isAgreementNotDeveloped,
    isAgreementAwarded,
    isPreAwardInReview = false,
    isAwardInReview = false,
    isPostPreAwardLocked = false,
    isAgreementFetching = false
}) => {
    // TODO: Create a custom hook for this business logix (./AgreementBudgetLines.hooks.js)
    const navigate = useTrailNavigate();
    // Change BL Status reads "… > <agreement> > Change BL Status", with the agreement crumb linking back to this tab.
    const changeStatusPath = `/agreements/review/${agreement?.id}`;
    const changeStatusAncestry = useAncestryForChildren({
        ownCrumb: { label: agreement?.name ?? "Agreement" },
        fallbackCrumb: LIST_CRUMBS.agreements
    });
    const [isExporting, setIsExporting] = React.useState(false);
    const [includeDrafts, setIncludeDrafts] = React.useState(false);
    const isSuperUser = useIsUserSuperUser();
    const canEditByRole = useCanEditByRole();
    const {
        data: servicesComponents,
        isLoading: isServicesComponentsLoading,
        isFetching: isServicesComponentsFetching,
        isError: isServicesComponentsError
    } = useGetServicesComponentsListQuery(agreement?.id);
    const {
        data: grantNumbers,
        isLoading: isGrantNumbersLoading,
        isFetching: isGrantNumbersFetching,
        isError: isGrantNumbersError
    } = useGetGrantNumbersListQuery(agreement?.id, {
        skip: !agreement?.id
    });
    const allBudgetLinesInReview = areAllBudgetLinesInReview(agreement?.budget_line_items ?? []);
    const isGrant = agreement?.agreement_type === AgreementType.GRANT;
    const isContract = agreement?.agreement_type === AgreementType.CONTRACT;
    // CLIN column is contract-only and only meaningful once the agreement is awarded.
    const showClinColumn = isContract && isAgreementAwarded;

    // Regular users must have permission and agreement must be in editable state
    const canRegularUserEdit = agreement?._meta.isEditable && !isAgreementNotDeveloped && !allBudgetLinesInReview;

    // All users (including superusers) are blocked by pre-award, award review, or post-pre-award lock
    const isAgreementEditable =
        canEditByRole &&
        !isPreAwardInReview &&
        !isAwardInReview &&
        !isPostPreAwardLocked &&
        (isSuperUser || canRegularUserEdit);
    // On an Awarded agreement, Planned→Executing now requires a Contract Modification (OPS-3072),
    // so the only status change left to offer here is Draft→Planned — disable the button outright
    // when there's no Draft BLI left to transition. Only with the ENABLE_MODIFIED_LOE_EDITS
    // capability on, and superusers bypass it, matching the backend. Shares the Review Agreement page's helper
    // (which skips in-review BLIs) so this button can't lead to a page with both actions disabled.
    const hasDraftBLI = anyBudgetLinesByStatus(agreement ?? {}, "DRAFT");
    const { data: versionData } = useGetVersionQuery();
    const blocksPlannedToExecuting =
        (versionData?.enable_modified_loe_edits ?? false) && isAgreementAwarded && !isSuperUser;
    const canRequestStatusChange = isAgreementEditable && (!blocksPlannedToExecuting || hasDraftBLI);
    // Guards against reaching the edit wizard via URL param (?mode=edit) when the agreement isn't editable.
    const showEditWizard = isEditMode && isAgreementEditable;
    // EditAgreementProvider seeds its state from these lists only on mount, so mounting it while
    // either query is in flight freezes an empty list: existing SCs vanish from the editor and
    // the next SC the user adds replaces them. Wait for both, like the other editor pages do.
    const isEditorDataLoading = isServicesComponentsLoading || isGrantNumbersLoading;
    // The editor is seeded from the same lists, and save resolves each budget line's link (grant number
    // or SC) against them and nulls any it can't find. Opening it after a failed load would unlink
    // every existing budget line on save, so keep it closed and show an error instead.
    const editorDataLoadFailed = isServicesComponentsError || isGrantNumbersError;
    // A save only invalidates the cache, so right after one this page still shows the pre-save
    // agreement and lists while they refetch (isLoading stays false). The editor seeds once on mount,
    // so opening it then would freeze the stale budget lines, and the next save would write the old
    // values back. Wait for any refetch before opening it, then keep it open: saving from the editor
    // starts refetches while the save is still running, and unmounting would drop that save.
    // RTK Query's default "delayed" invalidation holds a save's tag invalidation while any other request in
    // the slice is in flight, so a refetch of the editor's data may not have started yet. Waiting for the
    // whole slice to settle mirrors that rule: once nothing is pending, every held refetch has run.
    const isAnyApiRequestPending = useSelector(selectIsAnyOpsApiRequestPending);
    const isEditorDataFetching =
        isAgreementFetching || isServicesComponentsFetching || isGrantNumbersFetching || isAnyApiRequestPending;
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const canOpenEditor = showEditWizard && !editorDataLoadFailed && !isEditorDataLoading && !isEditorDataFetching;
    if (canOpenEditor && !isEditorOpen) {
        setIsEditorOpen(true);
    }
    // Also close it after a failed load, so a retry has to finish before the editor reopens.
    if ((!showEditWizard || editorDataLoadFailed) && isEditorOpen) {
        setIsEditorOpen(false);
    }
    const filters = { agreementIds: [agreement?.id] };

    // details for AgreementTotalBudgetLinesCard
    let blis = agreement?.budget_line_items ?? [];
    const filteredBlis = includeDrafts ? blis : blis.filter((bli) => !draftBudgetLineStatuses.includes(bli.status));
    const currentFiscalYear = getCurrentFiscalYear();

    // Reuse the centralized tooltip strings so this button stays in sync with the Edit button.
    const toolTipLabel = () => {
        switch (true) {
            case isAgreementNotDeveloped:
                return EDIT_DISABLED_TOOLTIPS.notDeveloped;
            case isPreAwardInReview:
                return EDIT_DISABLED_TOOLTIPS.preAwardInReview;
            case isAwardInReview:
                return EDIT_DISABLED_TOOLTIPS.awardInReview;
            case isPostPreAwardLocked:
                return EDIT_DISABLED_TOOLTIPS.postPreAwardLocked;
            case allBudgetLinesInReview:
                return EDIT_DISABLED_TOOLTIPS.allBudgetLinesInReview;
            case blocksPlannedToExecuting && !hasDraftBLI:
                return EDIT_DISABLED_TOOLTIPS.awardedNoDraftBLIs;
            default:
                return EDIT_DISABLED_TOOLTIPS.notTeamMemberBLStatus;
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
        let feePercentage = calculateProcShopFeePercentage(bl) / 100;
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

    // Use useMemo instead of useEffect + useState to prevent infinite loops
    const budgetLines = React.useMemo(() => {
        let newTempBudgetLines =
            (agreement?.budget_line_items && agreement.budget_line_items.length > 0
                ? agreement.budget_line_items
                : null) ?? [];

        return newTempBudgetLines.map((bli) => {
            if (isGrant) {
                const budgetLineGrantNumber = grantNumbers?.find((gn) => gn.id === bli.grant_number_id);
                const grantNumberNumber = budgetLineGrantNumber?.number ?? 0;
                return { ...bli, grant_number_number: grantNumberNumber };
            }
            const budgetLineServicesComponent = servicesComponents?.find((sc) => sc.id === bli.services_component_id);
            const serviceComponentNumber = budgetLineServicesComponent?.number ?? 0;
            const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
                ? `${serviceComponentNumber}-${budgetLineServicesComponent?.sub_component}`
                : `${serviceComponentNumber}`;
            return { ...bli, services_component_number: serviceComponentNumber, serviceComponentGroupingLabel };
        });
    }, [agreement?.budget_line_items, servicesComponents, grantNumbers, isGrant]);

    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(budgetLines, servicesComponents);
    const groupedBudgetLinesByGrantNumber = groupByGrantNumber(budgetLines, grantNumbers ?? []);
    const [serviceComponentTrigger] = useLazyGetServicesComponentByIdQuery();
    const [budgetLineTrigger] = useLazyGetBudgetLineItemsQuery();
    const [portfolioTrigger] = useLazyGetPortfolioByIdQuery();

    if (isExporting) {
        return (
            <div className="bg-white display-flex flex-column flex-align-center flex-justify-center padding-y-4 height-viewport">
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
            {showEditWizard && editorDataLoadFailed && (
                <SimpleAlert
                    type="error"
                    heading="Budget lines can't be edited right now"
                    message={`The ${isServicesComponentsError ? "services components" : "grant numbers"} could not be loaded. Refresh the page to try again.`}
                />
            )}
            {!showEditWizard && (
                <>
                    <AgreementBudgetLinesHeader
                        heading="Budget Lines Summary"
                        details="The summary below shows a breakdown of the agreement total."
                        includeDrafts={includeDrafts}
                        setIncludeDrafts={setIncludeDrafts}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        isEditable={isAgreementEditable}
                        canUserEdit={isSuperUser || (agreement?._meta?.isEditable ?? false)}
                        isAgreementNotDeveloped={isAgreementNotDeveloped}
                        allBudgetLinesInReview={allBudgetLinesInReview}
                        isPreAwardInReview={isPreAwardInReview}
                        isAwardInReview={isAwardInReview}
                        isPostPreAwardLocked={isPostPreAwardLocked}
                        showEditButton={canEditByRole}
                    />
                    <div className="display-flex flex-justify">
                        <AgreementTotalCard
                            total={agreementTotal}
                            subtotal={agreementSubtotal}
                            fees={agreementFees}
                            procurementShopAbbr={agreement.procurement_shop?.abbr}
                            isGrant={isGrant}
                        />
                        <BLIsByFYSummaryCard
                            budgetLineItems={filteredBlis}
                            currentProcShopFeePercentage={agreement?.procurement_shop?.fee_percentage ?? 0}
                        />
                    </div>
                    <div className="margin-y-3">
                        <div className="display-flex flex-justify flex-align-center">
                            <h2 className="font-sans-lg">Budget Lines</h2>
                            {blis &&
                                blis?.length > 0 &&
                                (isGrant ? (
                                    <DisabledButtonWithTooltip
                                        label="Export coming soon"
                                        tooltipPosition="bottom"
                                        className="usa-button--unstyled text-primary display-flex flex-align-center cursor-pointer opacity-30"
                                        dataCy="budget-line-export"
                                    >
                                        <svg
                                            className={`height-2 width-2 margin-right-05`}
                                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                        >
                                            <use href={`${icons}#save_alt`}></use>
                                        </svg>
                                        <span>Export</span>
                                    </DisabledButtonWithTooltip>
                                ) : (
                                    <button
                                        type="button"
                                        style={{ fontSize: "16px" }}
                                        className="usa-button--unstyled text-primary display-flex flex-align-center cursor-pointer"
                                        data-cy="budget-line-export"
                                        onClick={() =>
                                            handleExport(
                                                exportTableToXlsx,
                                                setIsExporting,
                                                filters,
                                                blis,
                                                budgetLineTrigger,
                                                serviceComponentTrigger,
                                                portfolioTrigger,
                                                blis.length,
                                                showClinColumn,
                                                // Match the table, which shows OBE budget lines.
                                                true
                                            )
                                        }
                                    >
                                        <svg
                                            className={`height-2 width-2 margin-right-05`}
                                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                        >
                                            <use href={`${icons}#save_alt`}></use>
                                        </svg>
                                        <span>Export</span>
                                    </button>
                                ))}
                        </div>
                        <p className="font-sans-sm">
                            This is a list of all {isGrant ? "grant numbers" : "services components"} and budget lines
                            within this agreement.
                        </p>
                    </div>
                </>
            )}

            {showEditWizard && !editorDataLoadFailed && !isEditorOpen && <BudgetLinesTableLoading />}

            {showEditWizard && !editorDataLoadFailed && isEditorOpen && (
                <EditAgreementProvider
                    agreement={agreement}
                    projectOfficer={""}
                    alternateProjectOfficer={""}
                    servicesComponents={servicesComponents}
                    grantNumbers={grantNumbers ?? []}
                    budgetLines={agreement?.budget_line_items ?? []}
                >
                    <CreateBLIsAndSCs
                        selectedAgreement={agreement}
                        budgetLines={agreement?.budget_line_items ?? []}
                        isEditMode={isEditMode}
                        isAgreementAwarded={isAgreementAwarded}
                        setIsEditMode={setIsEditMode}
                        isReviewMode={false}
                        selectedProcurementShop={agreement?.procurement_shop}
                        selectedResearchProject={agreement?.project}
                        canUserEditBudgetLines={isAgreementEditable}
                        wizardSteps={[]}
                        continueBtnText="Save & Exit"
                        currentStep={0}
                        workflow="none"
                        includeDrafts={includeDrafts}
                        setIncludeDrafts={setIncludeDrafts}
                        goBack={() => {
                            setIsEditMode(false);
                            navigate(`/agreements/${agreement.id}/budget-lines`);
                        }}
                    />
                </EditAgreementProvider>
            )}

            {!showEditWizard && isServicesComponentsLoading && <BudgetLinesTableLoading />}

            {!showEditWizard &&
                isGrant &&
                groupedBudgetLinesByGrantNumber.length > 0 &&
                groupedBudgetLinesByGrantNumber.map((group, index) => (
                    <GrantNumberAccordion
                        key={`${group.grantNumberNumber}-${index}`}
                        grantNumberNumber={group.grantNumberNumber}
                        totalGrantNumbers={(grantNumbers ?? []).length}
                        withMetadata={true}
                        periodStart={findGrantPeriodStart(grantNumbers, group.grantNumberNumber)}
                        periodEnd={findGrantPeriodEnd(grantNumbers, group.grantNumberNumber)}
                        granteeRecipient={findGrantee(grantNumbers, group.grantNumberNumber)}
                        organizationType={findGrantOrganizationType(grantNumbers, group.grantNumberNumber)}
                        state={findGrantState(grantNumbers, group.grantNumberNumber)}
                        description={findGrantDescription(grantNumbers, group.grantNumberNumber)}
                    >
                        {group.budgetLines.length > 0 ? (
                            <BudgetLinesTable
                                budgetLines={group.budgetLines}
                                readOnly={true}
                                isEditable={agreement?._meta.isEditable}
                                isGrant={true}
                            />
                        ) : (
                            <p className="text-center margin-y-7">
                                You have not added any budget lines to this grant number yet.
                            </p>
                        )}
                    </GrantNumberAccordion>
                ))}

            {!showEditWizard &&
                !isGrant &&
                !isServicesComponentsLoading &&
                groupedBudgetLinesByServicesComponent.length > 0 &&
                groupedBudgetLinesByServicesComponent.map((group, index) => {
                    const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                        ? group.serviceComponentGroupingLabel
                        : group.servicesComponentNumber;

                    return (
                        <ServicesComponentAccordion
                            key={`${group.servicesComponentNumber}-${index}`}
                            servicesComponentNumber={group.servicesComponentNumber}
                            serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                            serviceRequirementType={agreement?.service_requirement_type ?? "NON_SEVERABLE"}
                            withMetadata={true}
                            periodStart={findPeriodStart(servicesComponents, budgetLineScGroupingLabel)}
                            periodEnd={findPeriodEnd(servicesComponents, budgetLineScGroupingLabel)}
                            description={findDescription(servicesComponents, budgetLineScGroupingLabel)}
                            optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                        >
                            {group.budgetLines.length > 0 ? (
                                <BudgetLinesTable
                                    budgetLines={group.budgetLines}
                                    readOnly={true}
                                    isEditable={agreement?._meta.isEditable}
                                    showClinColumn={showClinColumn}
                                />
                            ) : (
                                <p className="text-center margin-y-7">
                                    You have not added any budget lines to this services component yet.
                                </p>
                            )}
                        </ServicesComponentAccordion>
                    );
                })}

            {!showEditWizard &&
                !isServicesComponentsLoading &&
                (isGrant
                    ? groupedBudgetLinesByGrantNumber.length === 0
                    : groupedBudgetLinesByServicesComponent.length === 0) && (
                    <p className="text-center">You have not added any Budget Lines yet.</p>
                )}

            {!showEditWizard && canEditByRole && (
                <div className="grid-row flex-justify-end margin-top-1">
                    {canRequestStatusChange ? (
                        <Link
                            className="usa-button margin-top-4 margin-right-0"
                            to={changeStatusPath}
                            state={buildTrailState(changeStatusPath, changeStatusAncestry)}
                            data-cy="bli-continue-btn"
                        >
                            Change BL Status
                        </Link>
                    ) : (
                        <Tooltip label={toolTipLabel()}>
                            <span
                                className={"usa-button margin-top-4 margin-right-0 usa-button--disabled"}
                                aria-disabled="true"
                                data-cy="bli-continue-btn-disabled"
                            >
                                Change BL Status
                            </span>
                        </Tooltip>
                    )}
                </div>
            )}
        </>
    );
};

export default AgreementBudgetLines;
