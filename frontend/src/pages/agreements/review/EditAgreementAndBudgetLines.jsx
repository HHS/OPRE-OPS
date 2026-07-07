import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateAgreementEditBundleMutation
} from "../../../api/opsAPI";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import { BLI_STATUS, hasAnyBliInSelectedStatus } from "../../../helpers/budgetLines.helpers";
import { safeRedirectPath } from "../../../helpers/safeRedirect.helpers";
import { buildProcurementShopChangeAlert } from "../../../helpers/agreement.helpers";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";

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
        isLoading: isLoadingServicesComponents
    } = useGetServicesComponentsListQuery(agreementId, {
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

    const handleCancel = () => {
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
        if (bliSlice.budget_line_items) {
            bundle.budget_line_items = bliSlice.budget_line_items;
        }
        return bundle;
    };

    const fireBundleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const bundle = buildBundle();
            await updateEditBundle({ id: agreementId, data: bundle }).unwrap();

            const { shouldRequestChange, oldProcurementShop, newProcurementShop } = procurementShopChangeState;
            if (shouldRequestChange && oldProcurementShop && newProcurementShop) {
                setAlert(
                    buildProcurementShopChangeAlert({
                        budgetLines: agreement?.budget_line_items ?? [],
                        oldProcurementShop,
                        newProcurementShop,
                        redirectUrl: returnTo
                    })
                );
            } else {
                setAlert({
                    type: "success",
                    heading: "Changes Saved",
                    message: "Your changes have been saved.",
                    redirectUrl: returnTo
                });
            }
            scrollToTop();
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
            // Reseed services_components so optimistic edits revert to the server
            // copy, leaving the form consistent for the user to retry.
            setServicesComponentsReseedKey((key) => key + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePageSave = () => {
        if (isSaving) return;
        // Procurement-shop changes on agreements with planned BLIs route through
        // a change request — confirm before sending it to the Division Director.
        if (procurementShopChangeState.shouldRequestChange) {
            setShowProcurementShopModal(true);
            return;
        }
        fireBundleSave();
    };

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
                        handleConfirm={fireBundleSave}
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
