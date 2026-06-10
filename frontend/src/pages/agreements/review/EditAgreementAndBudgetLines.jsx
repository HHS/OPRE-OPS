import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery, useGetServicesComponentsListQuery } from "../../../api/opsAPI";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { BLI_STATUS, hasAnyBliInSelectedStatus } from "../../../helpers/budgetLines.helpers";
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
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);
    const [includeDrafts, setIncludeDrafts] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const saveAgreementRef = useRef(null);
    const verifyUniquenessRef = useRef(null);
    const saveBLIsAndSCsRef = useRef(null);

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

    const registerAgreementSave = useCallback(({ saveAgreement, verifyUniquenessBeforeSubmit }) => {
        saveAgreementRef.current = saveAgreement;
        verifyUniquenessRef.current = verifyUniquenessBeforeSubmit;
    }, []);

    const registerBatchSave = useCallback((handleSave) => {
        saveBLIsAndSCsRef.current = handleSave;
    }, []);

    const handleCancel = () => {
        navigate(`/agreements/review/${agreementId}`);
    };

    const handlePageSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const conflictField = await verifyUniquenessRef.current?.();
            if (conflictField) {
                setIsSaving(false);
                return;
            }

            if (hasAgreementChanged && saveAgreementRef.current) {
                await saveAgreementRef.current(null, true);
            }

            if (saveBLIsAndSCsRef.current) {
                await saveBLIsAndSCsRef.current(false);
            }

            setAlert({
                type: "success",
                heading: "Changes Saved",
                message: "Your changes have been saved.",
                redirectUrl: `/agreements/review/${agreementId}`
            });
            scrollToTop();
        } catch (error) {
            console.error("Error saving agreement and budget lines:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingAgreement || isLoadingServicesComponents) {
        return (
            <App breadCrumbName="Edit Agreement and Budget Lines">
                <h1>Loading...</h1>
            </App>
        );
    }

    if (errorAgreement || errorServicesComponent) {
        navigate("/error");
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
                    setHasAgreementChanged={setHasAgreementChanged}
                    isReviewMode={true}
                    isAgreementAwarded={isAgreementAwarded}
                    areAnyBudgetLinesPlanned={areAnyBudgetLinesPlanned}
                    hideFooterButtons={true}
                    registerSave={registerAgreementSave}
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
                    registerBatchSave={registerBatchSave}
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
                        disabled={isSaving}
                    >
                        Save changes
                    </button>
                </div>
            </EditAgreementProvider>
        </App>
    );
};

export default EditAgreementAndBudgetLines;
