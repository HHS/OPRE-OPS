import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import {
    useGetAgreementByIdQuery,
    useGetGrantNumbersListQuery,
    useGetServicesComponentsListQuery,
    useUpdateAgreementEditBundleMutation
} from "../../../api/opsAPI";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import SaveChangesAndExitModal from "../../../components/UI/Modals/SaveChangesAndExitModal";
import { BLI_STATUS, hasAnyBliInSelectedStatus } from "../../../helpers/budgetLines.helpers";
import { safeRedirectPath } from "../../../helpers/safeRedirect.helpers";
import { buildProcurementShopChangeAlert } from "../../../helpers/agreement.helpers";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
import useNavigationBlocker from "../../../hooks/useNavigationBlocker.hooks";
import { useIsUserBudgetTeam } from "../../../hooks/user.hooks";

/**
 * Single-page edit screen used by the review flow. Stacks Agreement Details, Acquisition Details,
 * Services Components, and Budget Lines on one page so users can address validation errors without
 * stepping through the Create Agreement wizard.
 *
 * On Save Changes, the page reads each child's bundle slice via a ref and fires a single
 * `PATCH /agreements/:id/edit-bundle`. The backend commits every change in one DB transaction —
 * any failure rolls back the whole thing, so this screen can never leave the agreement in a
 * partially-saved state.
 *
 * Route: /agreements/review/:id/edit
 *
 * @returns {React.ReactElement}
 */
const DEFAULT_RETURN_PATH = (agreementId) => `/agreements/review/${agreementId}`;

// Only allow same-origin absolute paths under /agreements/ so a crafted ?returnTo=
// can't open-redirect the user off-site after saving.
// Composes safeRedirectPath (handles scheme/backslash/protocol-relative checks) and
// then enforces the /agreements/ prefix and absence of path traversal sequences.
const sanitizeReturnTo = (raw, agreementId) => {
    const fallback = DEFAULT_RETURN_PATH(agreementId);
    const safe = safeRedirectPath(raw);
    if (safe === "/") return fallback;
    if (!safe.startsWith("/agreements/")) return fallback;
    if (safe.includes("..")) return fallback;
    return safe;
};

const EditAgreementAndBudgetLines = () => {
    const navigate = useNavigate();
    const urlPathParams = useParams();
    const agreementId = Number(urlPathParams.id);
    const isValidId = Number.isFinite(agreementId);
    const [searchParams] = useSearchParams();
    const returnTo = useMemo(
        () => sanitizeReturnTo(searchParams.get("returnTo"), agreementId),
        [searchParams, agreementId]
    );
    const { setAlert } = useAlert();

    const [projectOfficer, setProjectOfficer] = useState({});
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({});
    const [includeDrafts, setIncludeDrafts] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAgreementFormValid, setIsAgreementFormValid] = useState(true);
    const [isBudgetLinesValid, setIsBudgetLinesValid] = useState(true);
    // Bumped on save failure so the editor reseeds services_components from the
    // server-cached list, reverting any optimistic edits the user had in flight.
    const [servicesComponentsReseedKey, setServicesComponentsReseedKey] = useState(0);
    // Mirrors servicesComponentsReseedKey for grant numbers (grant agreements only).
    const [grantNumbersReseedKey, setGrantNumbersReseedKey] = useState(0);
    // Mirrors servicesComponentsReseedKey for budget line items.
    const [budgetLinesReseedKey, setBudgetLinesReseedKey] = useState(0);

    // Children populate these refs with `{ getSlice }` callbacks so the page can
    // read their current edits synchronously when the user clicks Save Changes.
    const agreementSliceRef = useRef(null);
    const blisSliceRef = useRef(null);

    // Procurement-shop change-request state pushed up by the agreement form.
    // When `shouldRequestChange` is true, saving has to be confirmed because
    // it sends an approval request to the Division Director instead of a
    // direct write.
    const [procurementShopChangeState, setProcurementShopChangeState] = useState({
        shouldRequestChange: false,
        oldProcurementShop: null,
        newProcurementShop: null
    });
    // Financial-snapshot and procurement-shop changes both route through change requests
    // requiring Division Director approval — one modal covers both cases.
    const isBudgetTeam = useIsUserBudgetTeam();
    const [requiresFinancialApproval, setRequiresFinancialApproval] = useState(false);
    const [showFinancialApprovalModal, setShowFinancialApprovalModal] = useState(false);

    // Page-level dirty state aggregated from both sub-forms for the nav-away blocker.
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);
    const [hasBLIsChanged, setHasBLIsChanged] = useState(false);
    const hasPageChanged = hasAgreementChanged || hasBLIsChanged;

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !isValidId
    });

    // Budget Team direct-edit bypass applies when the agreement has a pending award
    // approval (step 6). Read the backend-derived flag so this stays in sync with the
    // server's is_award_approval_requested check (single source of truth) rather than
    // inferring context from the returnTo URL.
    const isAwardApprovalContext = agreement?.is_award_approval_requested === true;

    const {
        data: servicesComponents,
        error: errorServicesComponent,
        isLoading: isLoadingServicesComponents
    } = useGetServicesComponentsListQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !isValidId
    });

    const {
        data: grantNumbers,
        error: errorGrantNumbers,
        isLoading: isLoadingGrantNumbers
    } = useGetGrantNumbersListQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !isValidId
    });

    const [updateEditBundle] = useUpdateAgreementEditBundleMutation();

    useEffect(() => {
        if (agreement?.project_officer_id) {
            getUser(agreement.project_officer_id).then(setProjectOfficer).catch(console.error);
        }
        if (agreement?.alternate_project_officer_id) {
            getUser(agreement.alternate_project_officer_id).then(setAlternateProjectOfficer).catch(console.error);
        }
    }, [agreement]);

    // Nav-away blocker. Shows one of two modals depending on whether the pending changes
    // require DD approval. `saveChanges` receives the intended destination so the success
    // alert redirects there instead of the fixed returnTo URL.
    const requiresApproval = requiresFinancialApproval || procurementShopChangeState.shouldRequestChange;

    const saveAndNavigateTo = async (destination) => {
        await fireBundleSave(destination ?? returnTo);
    };

    const { showBlockerModal, setShowBlockerModal, blockerModalProps, setIsCancelling, isBypassingRef } =
        useNavigationBlocker({
            hasChanged: hasPageChanged,
            saveChanges: saveAndNavigateTo,
            onExit: () => {
                setHasAgreementChanged(false);
                setHasBLIsChanged(false);
            },
            requiresApproval
        });

    const handleCancel = () => {
        setIsCancelling(true);
        navigate(returnTo);
    };

    const buildBundle = () => {
        const bundle = {};
        const agreementSlice = agreementSliceRef.current?.getSlice?.();
        if (agreementSlice) {
            bundle.agreement = agreementSlice;
        }
        const bliSlice = blisSliceRef.current?.getSlice?.() ?? {};
        if (bliSlice.services_components) {
            bundle.services_components = bliSlice.services_components;
        }
        if (bliSlice.grant_numbers) {
            bundle.grant_numbers = bliSlice.grant_numbers;
        }
        if (bliSlice.budget_line_items) {
            bundle.budget_line_items = bliSlice.budget_line_items;
        }
        return bundle;
    };

    /**
     * Execute the atomic edit-bundle save.
     * @param {string} [destination=returnTo] - Where to redirect after a successful save.
     *   Defaults to `returnTo` (the review page). The nav-away modal passes the user's
     *   intended destination so they land where they clicked, not back on the review page.
     */
    const fireBundleSave = async (destination = returnTo) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const bundle = buildBundle();
            const result = await updateEditBundle({ id: agreementId, data: bundle }).unwrap();

            const { shouldRequestChange, oldProcurementShop, newProcurementShop } = procurementShopChangeState;
            if (shouldRequestChange && oldProcurementShop && newProcurementShop) {
                setAlert(
                    buildProcurementShopChangeAlert({
                        budgetLines: agreement?.budget_line_items ?? [],
                        oldProcurementShop,
                        newProcurementShop,
                        redirectUrl: destination
                    })
                );
            } else if (result?.change_request_ids?.length) {
                // Backend created change requests (e.g. budget team outside award-approval context) —
                // edits are pending DD approval, not applied immediately.
                setAlert({
                    type: "success",
                    heading: "Changes Sent to Approval",
                    message:
                        "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.",
                    redirectUrl: destination
                });
            } else {
                setAlert({
                    type: "success",
                    heading: "Changes Saved",
                    message: "Your changes have been saved.",
                    redirectUrl: destination
                });
            }
            // Synchronously bypass the blocker before the alert redirects. The RTK
            // refetch triggered by a successful save can re-fire child dirty-state
            // callbacks before Alert's useEffect navigates, re-enabling the blocker
            // and intercepting the redirect. Setting a ref is synchronous and is
            // read directly by the blocker predicate on the next navigation attempt.
            isBypassingRef.current = true;
            blisSliceRef.current?.resetUnsavedChanges?.();
            setHasAgreementChanged(false);
            setHasBLIsChanged(false);
            scrollToTop();
            // Reset the bypass after the alert's navigate fires (next tick) so the
            // blocker is re-enabled if the user makes further edits on the page.
            setTimeout(() => {
                isBypassingRef.current = false;
            }, 0);
        } catch (error) {
            const detail =
                error?.data?.error ||
                error?.message ||
                "If you continue to experience this issue, please submit a Budget Support Request through ORBIT.";
            setAlert({
                type: "error",
                heading: "Error saving changes",
                message: `An error occurred while saving. ${detail}`
            });
            // Bundle save is atomic — on failure the server state is unchanged.
            // Reseed services_components / grant_numbers so optimistic edits revert to the
            // server copy, leaving the form consistent for the user to retry.
            setServicesComponentsReseedKey((key) => key + 1);
            setGrantNumbersReseedKey((key) => key + 1);
            setBudgetLinesReseedKey((key) => key + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePageSave = () => {
        if (isSaving) return;
        // Both procurement-shop and BLI financial changes route through change requests that
        // need Division Director approval — show one confirmation covering either case.
        // Budget team bypasses the modal only when editing from the award-approval review page
        // (step 6), matching the backend's is_award_approval_requested condition.
        const budgetTeamBypasses = isBudgetTeam && isAwardApprovalContext;
        if (!budgetTeamBypasses && (procurementShopChangeState.shouldRequestChange || requiresFinancialApproval)) {
            setShowFinancialApprovalModal(true);
            return;
        }
        fireBundleSave();
    };

    useEffect(() => {
        if (!isValidId || errorAgreement || errorServicesComponent || errorGrantNumbers) {
            navigate("/error");
        }
    }, [isValidId, errorAgreement, errorServicesComponent, errorGrantNumbers, navigate]);

    if (isLoadingAgreement || isLoadingServicesComponents || isLoadingGrantNumbers) {
        return (
            <App breadCrumbName="Edit Agreement and Budget Lines">
                <h1>Loading...</h1>
            </App>
        );
    }

    if (!isValidId || errorAgreement || errorServicesComponent || errorGrantNumbers) {
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
                grantNumbers={grantNumbers ?? []}
                grantNumbersReseedKey={grantNumbersReseedKey}
                budgetLines={agreement?.budget_line_items ?? []}
                budgetLinesReseedKey={budgetLinesReseedKey}
            >
                <h1 className="font-sans-lg margin-bottom-2">Edit Agreement Details</h1>
                {showFinancialApprovalModal && (
                    <ConfirmationModal
                        heading="Budget changes require approval from your Division Director. Do you want to send it to approval?"
                        actionButtonText="Send to Approval"
                        secondaryButtonText="Continue Editing"
                        setShowModal={setShowFinancialApprovalModal}
                        handleConfirm={fireBundleSave}
                    />
                )}
                {showBlockerModal && (
                    <SaveChangesAndExitModal
                        heading={blockerModalProps.heading}
                        description={blockerModalProps.description}
                        actionButtonText={blockerModalProps.actionButtonText}
                        secondaryButtonText={blockerModalProps.secondaryButtonText}
                        handleConfirm={blockerModalProps.handleConfirm}
                        handleSecondary={blockerModalProps.handleSecondary}
                        closeModal={blockerModalProps.closeModal}
                        setShowModal={setShowBlockerModal}
                    />
                )}
                <AgreementEditForm
                    isReviewMode={true}
                    isAgreementAwarded={isAgreementAwarded}
                    areAnyBudgetLinesPlanned={areAnyBudgetLinesPlanned}
                    hideFooterButtons={true}
                    onValidityChange={setIsAgreementFormValid}
                    onProcurementShopChangeStateChange={setProcurementShopChangeState}
                    bundleSliceRef={agreementSliceRef}
                    setHasAgreementChanged={setHasAgreementChanged}
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
                    onValidityChange={setIsBudgetLinesValid}
                    bundleSliceRef={blisSliceRef}
                    onFinancialChangeStateChange={setRequiresFinancialApproval}
                    onHasUnsavedChangesChange={setHasBLIsChanged}
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
