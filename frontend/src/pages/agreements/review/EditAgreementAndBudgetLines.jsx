import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery, useGetServicesComponentsListQuery } from "../../../api/opsAPI";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { BLI_STATUS, hasAnyBliInSelectedStatus } from "../../../helpers/budgetLines.helpers";
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
    const agreementId = parseInt(urlPathParams.id ?? "");
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

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });

    const {
        data: servicesComponents,
        error: errorServicesComponent,
        isLoading: isLoadingServicesComponents
    } = useGetServicesComponentsListQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
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

    // Suppresses the inner success alert/redirect from CreateBLIsAndSCs and replaces it
    // with one that returns the user to the review page. Only fires when the BLI save
    // path runs `showSuccessMessage` (no financial-snapshot approval modal). When the
    // approval modal IS triggered, that flow owns its own alert + redirect.
    const continueOverRide = useCallback(() => {
        setAlert({
            type: "success",
            heading: "Changes Saved",
            message: "Your changes have been saved.",
            redirectUrl: `/agreements/review/${agreementId}`
        });
        scrollToTop();
    }, [agreementId, setAlert]);

    const handlePageSave = () => {
        if (isSaving) return;
        setIsSaving(true);
        // Kick off the agreement save first; BLI save chains in `handleAgreementSaved`.
        setAgreementSaveTrigger((n) => n + 1);
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

    const handleAgreementSaved = useCallback(
        (result) => {
            if (!result.ok) {
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
        [reportSaveError]
    );

    const handleBLISaved = useCallback(
        (result) => {
            if (!result.ok) {
                reportSaveError(result.error);
            }
            setIsSaving(false);
        },
        [reportSaveError]
    );

    useEffect(() => {
        if (errorAgreement || errorServicesComponent) {
            navigate("/error");
        }
    }, [errorAgreement, errorServicesComponent, navigate]);

    if (isLoadingAgreement || isLoadingServicesComponents) {
        return (
            <App breadCrumbName="Edit Agreement and Budget Lines">
                <h1>Loading...</h1>
            </App>
        );
    }

    if (errorAgreement || errorServicesComponent) {
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
            >
                <h1 className="font-sans-lg margin-bottom-2">Edit Agreement Details</h1>
                <AgreementEditForm
                    isReviewMode={true}
                    isAgreementAwarded={isAgreementAwarded}
                    areAnyBudgetLinesPlanned={areAnyBudgetLinesPlanned}
                    hideFooterButtons={true}
                    saveTrigger={agreementSaveTrigger}
                    onSaved={handleAgreementSaved}
                    onValidityChange={setIsAgreementFormValid}
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
                    continueOverRide={continueOverRide}
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
