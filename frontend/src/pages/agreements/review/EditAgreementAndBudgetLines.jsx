import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery, useGetServicesComponentsListQuery } from "../../../api/opsAPI";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import { BLI_STATUS, hasAnyBliInSelectedStatus } from "../../../helpers/budgetLines.helpers";
import { calculateAgreementTotal } from "../../../helpers/agreement.helpers";
import { scrollToCenter } from "../../../helpers/scrollToCenter.helper";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";

/**
 * Single-page edit screen used by the review flow. Stacks Agreement Details, Acquisition Details,
 * Services Components, and Budget Lines on one page so users can address validation errors without
 * stepping through the Create Agreement wizard.
 *
 * Route: /agreements/review/:id/edit
 *
 * @returns {React.ReactElement}
 */
const EditAgreementAndBudgetLines = () => {
    const navigate = useNavigate();
    const urlPathParams = useParams();
    const agreementId = Number(urlPathParams.id);
    const isValidId = Number.isFinite(agreementId);
    const { setAlert } = useAlert();

    const [projectOfficer, setProjectOfficer] = useState({});
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({});
    const [includeDrafts, setIncludeDrafts] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAgreementFormValid, setIsAgreementFormValid] = useState(true);
    const [isBudgetLinesValid, setIsBudgetLinesValid] = useState(true);

    // Save coordination via incrementing triggers. Each child runs its save when
    // its trigger increments, then reports back through `onSaved`. We chain them
    // so the agreement saves first, then the budget lines.
    const [agreementSaveTrigger, setAgreementSaveTrigger] = useState(0);
    const [bliSaveTrigger, setBliSaveTrigger] = useState(0);
    // Bumped after a save failure + SC refetch to tell the editor context to
    // reseed services_components from canonical server data (reverting any
    // optimistic edits the user had made).
    const [servicesComponentsReseedKey, setServicesComponentsReseedKey] = useState(0);

    // Procurement-shop change-request state pushed up by the agreement form.
    // When `shouldRequestChange` is true, saving has to be confirmed because
    // it sends an approval request to the Division Director instead of a
    // direct write.
    const [procurementShopChangeState, setProcurementShopChangeState] = useState({
        shouldRequestChange: false,
        oldProcurementShop: null,
        newProcurementShop: null
    });
    const [showProcurementShopModal, setShowProcurementShopModal] = useState(false);

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !isValidId
    });

    const {
        data: servicesComponents,
        error: errorServicesComponent,
        isLoading: isLoadingServicesComponents,
        refetch: refetchServicesComponents
    } = useGetServicesComponentsListQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !isValidId
    });

    useEffect(() => {
        if (agreement?.project_officer_id) {
            getUser(agreement.project_officer_id).then(setProjectOfficer).catch(console.error);
        }
        if (agreement?.alternate_project_officer_id) {
            getUser(agreement.alternate_project_officer_id).then(setAlternateProjectOfficer).catch(console.error);
        }
    }, [agreement]);

    const handleCancel = () => {
        navigate(`/agreements/review/${agreementId}`);
    };

    const startSave = useCallback(() => {
        setIsSaving(true);
        // Kick off the agreement save first; BLI save chains in `handleAgreementSaved`.
        setAgreementSaveTrigger((n) => n + 1);
    }, []);

    const handlePageSave = () => {
        if (isSaving) return;
        // Procurement-shop changes on agreements with planned BLIs route through
        // a change request — confirm before sending it to the Division Director.
        if (procurementShopChangeState.shouldRequestChange) {
            setShowProcurementShopModal(true);
            return;
        }
        startSave();
    };

    const reportSaveError = useCallback(
        (error) => {
            const detail = error?.data?.error || error?.message || "Please try again.";
            setAlert({
                type: "error",
                heading: "Error saving changes",
                message: `An error occurred while saving. ${detail}`
            });
        },
        [setAlert]
    );

    const revertOptimisticServicesComponents = useCallback(async () => {
        try {
            await refetchServicesComponents().unwrap();
        } catch (err) {
            // If refetch fails, fall back to whatever cache we have. The reseed
            // still pulls from the current prop, which is the last known good list.
            console.error("Failed to refetch services components after save error", err);
        }
        setServicesComponentsReseedKey((n) => n + 1);
    }, [refetchServicesComponents]);

    const handleAgreementSaved = useCallback(
        (result) => {
            if (!result.ok) {
                // The user may have already made optimistic SC edits in the
                // editor context; refetch + reseed reverts them on failure.
                revertOptimisticServicesComponents();
                if (result.conflictField) {
                    requestAnimationFrame(() => scrollToCenter(result.conflictField));
                } else {
                    reportSaveError(result.error);
                }
                setIsSaving(false);
                return;
            }
            // Agreement saved (or skipped because unchanged): chain into BLI save.
            setBliSaveTrigger((n) => n + 1);
        },
        [reportSaveError, revertOptimisticServicesComponents]
    );

    const handleBLISaved = useCallback(
        (result) => {
            if (!result.ok) {
                // Reseed services components from the server so optimistic edits
                // (e.g. PoP end date) revert to persisted values on save failure.
                revertOptimisticServicesComponents();
                reportSaveError(result.error);
                setIsSaving(false);
                return;
            }
            // Both saves succeeded — set the single page-level success alert and redirect
            // back to the review page. Children have suppressed their own success alerts
            // so this is the one source of truth for the user-facing message.
            const { shouldRequestChange, oldProcurementShop, newProcurementShop } = procurementShopChangeState;
            if (shouldRequestChange && oldProcurementShop && newProcurementShop) {
                const budgetLines = agreement?.budget_line_items ?? [];
                const oldTotal = calculateAgreementTotal(budgetLines, oldProcurementShop?.fee_percentage ?? 0);
                const newTotal = calculateAgreementTotal(budgetLines, newProcurementShop?.fee_percentage ?? 0);
                setAlert({
                    type: "success",
                    heading: "Changes Sent to Approval",
                    message:
                        `Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.\n\n` +
                        `<strong>Pending Changes:</strong>\n` +
                        `<ul><li>Procurement Shop: ${oldProcurementShop?.name} (${oldProcurementShop?.abbr}) to ${newProcurementShop.name} (${newProcurementShop.abbr})</li>` +
                        `<li>Fee Rate: ${oldProcurementShop?.fee_percentage}% to ${newProcurementShop.fee_percentage}%</li>` +
                        `<li>Fee Total: $${oldTotal} to $${newTotal}</li></ul>`,
                    redirectUrl: `/agreements/review/${agreementId}`
                });
            } else {
                setAlert({
                    type: "success",
                    heading: "Changes Saved",
                    message: "Your changes have been saved.",
                    redirectUrl: `/agreements/review/${agreementId}`
                });
            }
            scrollToTop();
            setIsSaving(false);
        },
        [
            reportSaveError,
            setAlert,
            agreementId,
            revertOptimisticServicesComponents,
            procurementShopChangeState,
            agreement?.budget_line_items
        ]
    );

    useEffect(() => {
        if (!isValidId || errorAgreement || errorServicesComponent) {
            navigate("/error");
        }
    }, [isValidId, errorAgreement, errorServicesComponent, navigate]);

    if (isLoadingAgreement || isLoadingServicesComponents) {
        return (
            <App breadCrumbName="Edit Agreement and Budget Lines">
                <h1>Loading...</h1>
            </App>
        );
    }

    if (!isValidId || errorAgreement || errorServicesComponent) {
        return null;
    }

    const canUserEditAgreement = agreement?._meta?.isEditable;
    if (!canUserEditAgreement) {
        return (
            <App breadCrumbName="Edit Agreement and Budget Lines">
                <h1 className="font-sans-2xl margin-bottom-2">Access Denied</h1>
                <SimpleAlert
                    type="error"
                    heading="Error"
                    message="This Agreement cannot be edited."
                    headingLevel={2}
                />
                <Link
                    to="/"
                    className="usa-button margin-top-4"
                >
                    Go back home
                </Link>
            </App>
        );
    }

    const isAgreementAwarded = agreement?.is_awarded;
    const areAnyBudgetLinesPlanned = hasAnyBliInSelectedStatus(agreement?.budget_line_items ?? [], BLI_STATUS.PLANNED);

    return (
        <App breadCrumbName="Edit Agreement and Budget Lines">
            <EditAgreementProvider
                agreement={agreement}
                projectOfficer={projectOfficer}
                alternateProjectOfficer={alternateProjectOfficer}
                servicesComponents={servicesComponents ?? []}
                servicesComponentsReseedKey={servicesComponentsReseedKey}
            >
                <h1 className="font-sans-lg margin-bottom-2">Edit Agreement Details</h1>
                {showProcurementShopModal && (
                    <ConfirmationModal
                        heading="Changing the Procurement Shop will impact the fee rate on each budget line. Budget changes require approval from your Division Director. Do you want to send it to approval?"
                        actionButtonText="Send to Approval"
                        secondaryButtonText="Continue Editing"
                        setShowModal={setShowProcurementShopModal}
                        handleConfirm={startSave}
                    />
                )}
                <AgreementEditForm
                    isReviewMode={true}
                    isAgreementAwarded={isAgreementAwarded}
                    areAnyBudgetLinesPlanned={areAnyBudgetLinesPlanned}
                    hideFooterButtons={true}
                    saveTrigger={agreementSaveTrigger}
                    onSaved={handleAgreementSaved}
                    onValidityChange={setIsAgreementFormValid}
                    onProcurementShopChangeStateChange={setProcurementShopChangeState}
                />
                <CreateBLIsAndSCs
                    workflow="agreement"
                    budgetLines={agreement?.budget_line_items ?? []}
                    selectedAgreement={agreement}
                    selectedProcurementShop={agreement?.procurement_shop ?? {}}
                    canUserEditBudgetLines={true}
                    isReviewMode={true}
                    isEditMode={true}
                    includeDrafts={includeDrafts}
                    setIncludeDrafts={setIncludeDrafts}
                    continueBtnText="Save Changes"
                    hideFooterButtons={true}
                    hideWizardChrome={true}
                    saveTrigger={bliSaveTrigger}
                    onSaved={handleBLISaved}
                    onValidityChange={setIsBudgetLinesValid}
                />
                <div className="grid-row flex-justify-end margin-top-4">
                    <button
                        type="button"
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-edit-agreement-btn"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="usa-button"
                        data-cy="save-edit-agreement-btn"
                        onClick={handlePageSave}
                        disabled={isSaving || !isAgreementFormValid || !isBudgetLinesValid}
                    >
                        Save changes
                    </button>
                </div>
            </EditAgreementProvider>
        </App>
    );
};

export default EditAgreementAndBudgetLines;
