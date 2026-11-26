import React from "react";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";
import useAlert from "../../hooks/use-alert.hooks";
import { useEditAgreement, useEditAgreementDispatch } from "../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import { isDeletionRoutedToApproval } from "../BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.helpers";
import { initialFormData } from "./ServicesComponents.constants";
import { formatServiceComponent } from "./ServicesComponents.helpers";
import popValidationSuite from "./ServicesComponentForm/popValidationSuite";

const POP_CONFIRMATION_MESSAGE =
    "Changing the Period of Performance dates will alter the agreement’s Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue updating this services component?";

// Mirrors the backend's block (OPS-3268): the SC->BLI link is ON DELETE SET NULL, so deleting the SC
// would silently unlink lines that are on the contract.
const HAS_EXECUTING_BUDGET_LINES_MESSAGE =
    "This services component has Executing or Obligated budget lines. Move them to another services component before deleting it.";

const POP_DELETE_CONFIRMATION_MESSAGE =
    "Deleting this Services Component will alter the agreement’s overall Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue deleting this services component?";

/**
 * @param {number} agreementId - The ID of the agreement.
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} serviceRequirementType - The type of service requirement.
 * @param {string} continueBtnText - The text to display on the "Continue" button.
 * @param {Function} setHasUnsavedChanges - Function to mark the parent form dirty.
 * @param {import('vest').Suite<any, any>} [scFormSuite] - Vest suite for the SC form's required fields.
 * @param {import('../../types/BudgetLineTypes').BudgetLine[]} [nonDraftBudgetLines] - Non-draft BLIs used by the PoP validation suite.
 * @param {import('../../types/BudgetLineTypes').BudgetLine[]} [allBudgetLines] - Every BLI on the agreement (including Draft), used to decide delete behavior for an SC's own budget lines (OPS-3268).
 * @param {boolean} [isSuperUser] - Whether the acting user is a super user (OPS-3268: affects whether a Planned/Executing line's deletion is immediate or approval-routed).
 * @param {boolean} [tracksContractModifications] - Whether the agreement is Awarded and tracked (OPS-3072/OPS-3268): also makes a Planned/Executing line's deletion immediate.
 */
const useServicesComponents = (
    agreementId,
    serviceRequirementType,
    continueBtnText,
    setHasUnsavedChanges,
    scFormSuite,
    nonDraftBudgetLines = [],
    allBudgetLines = [],
    isSuperUser = false,
    tracksContractModifications = false
) => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState(serviceRequirementType);
    const [formData, setFormData] = React.useState(initialFormData);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [formKey, setFormKey] = React.useState(Date.now());
    // Bumped only when performDelete actually runs, so the component's focus-restoration effect
    // can tell "the user just deleted an SC" apart from any other reason services_components might
    // shrink (e.g. a save failure reseeding it back to the server's shorter list) -- OPS-3268.
    const [deleteCount, setDeleteCount] = React.useState(0);
    const { setAlert } = useAlert();

    const dispatch = useEditAgreementDispatch();
    const { services_components: servicesComponents } = useEditAgreement() || {};

    // Reset the PoP validation suite on mount and unmount so a stale result from a
    // previous agreement or SC never carries over into this session. (mirrors issue #5894)
    React.useEffect(() => {
        popValidationSuite.reset();
        return () => {
            popValidationSuite.reset();
        };
    }, []);

    // Merge the live form dates into allServicesComponents so the suite always sees the
    // current period values — context only updates after dispatch. In "edit" mode this means
    // patching the matching SC's dates; in "add" mode the new SC doesn't exist in context yet,
    // so it must be appended, or the suite sees only the already-saved SCs.
    const allServicesComponentsForSuite = React.useMemo(() => {
        const existing = servicesComponents ?? [];
        if (formData.mode === "add") {
            return [
                ...existing,
                {
                    number: formData.number,
                    period_start: formatDateForApi(formData.popStartDate),
                    period_end: formatDateForApi(formData.popEndDate)
                }
            ];
        }
        if (formData.mode !== "edit") return existing;
        return existing.map((sc) => {
            if (sc.number !== formData.number) return sc;
            return {
                ...sc,
                period_start: formatDateForApi(formData.popStartDate) ?? sc.period_start,
                period_end: formatDateForApi(formData.popEndDate) ?? sc.period_end
            };
        });
    }, [servicesComponents, formData.mode, formData.number, formData.popStartDate, formData.popEndDate]);

    /**
     * Persists the current form data (add or edit), fires the success alert, and
     * resets the form. Runs unconditionally once the caller has decided the save
     * should proceed — either because the PoP check passed, or because the user
     * confirmed the "Continue with Updates" modal.
     */
    const performSave = () => {
        setFormKey(Date.now());
        let formattedDisplayTitle = formatServiceComponent(formData.number, Boolean(formData.optional), serviceTypeReq);
        let newFormData = {
            agreement_id: agreementId,
            number: Number(formData.number),
            optional: Boolean(formData.optional),
            description: formData.description,
            period_start: formatDateForApi(formData.popStartDate),
            period_end: formatDateForApi(formData.popEndDate),
            display_title: formattedDisplayTitle
        };

        if (formData.mode === "add") {
            dispatch({
                type: "ADD_SERVICES_COMPONENT",
                payload: newFormData
            });
            setHasUnsavedChanges(true);
            setFormData(initialFormData);
            setFormKey(Date.now());
            setAlert({
                type: "success",
                message: `${formattedDisplayTitle} has been successfully added. When you're done editing, click ${continueBtnText} below.`,
                isCloseable: false,
                isToastMessage: true
            });
        }
        if (formData.mode === "edit") {
            newFormData.has_changed = true;
            dispatch({
                type: "UPDATE_SERVICES_COMPONENT",
                payload: { ...formData, ...newFormData }
            });
            setHasUnsavedChanges(true);
            setFormData(initialFormData);
            setFormKey(Date.now());
            setAlert({
                type: "success",
                message: `${formattedDisplayTitle} has been successfully updated. When you're done editing, click ${continueBtnText} below.`,
                isCloseable: false,
                isToastMessage: true
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (scFormSuite?.get()?.hasErrors()) return;

        const popCheck = popValidationSuite.run({
            mode: formData.mode,
            allServicesComponents: allServicesComponentsForSuite,
            nonDraftBudgetLines
        });

        if (popCheck.hasErrors()) {
            setShowModal(true);
            setModalProps({
                heading: POP_CONFIRMATION_MESSAGE,
                actionButtonText: "Continue with Updates",
                secondaryButtonText: "Cancel",
                handleConfirm: () => {
                    setShowModal(false);
                    performSave();
                }
            });
            return;
        }

        performSave();
    };

    /**
     * Dispatches the deletion, fires the success alert, and resets the form. Runs
     * unconditionally once the caller has decided the delete should proceed — either
     * because there was no PoP conflict, or because the user confirmed the PoP-impact modal
     * or the Draft/Planned budget-line choice modal.
     *
     * Deleting the chosen budget lines first (OPS-3268 UX feedback item) matters: the SC delete's
     * own reconciliation only unassigns whatever budget lines are still linked to it, so by the
     * time it runs, only the ones NOT passed here (e.g. OBE lines, which are always kept) are left
     * to unassign.
     * @param {object} selectedServicesComponent
     * @param {import('../../types/BudgetLineTypes').BudgetLine[]} [budgetLinesToDelete]
     */
    const performDelete = (selectedServicesComponent, budgetLinesToDelete = []) => {
        budgetLinesToDelete.forEach((budgetLine) => {
            dispatch({
                type: "DELETE_BUDGET_LINE_ITEM",
                payload: budgetLine
            });
        });
        dispatch({
            type: "DELETE_SERVICE_COMPONENT",
            payload: selectedServicesComponent
        });
        setHasUnsavedChanges(true);
        setShowModal(false);
        setFormKey(Date.now());
        setDeleteCount((count) => count + 1);
        popValidationSuite.reset();
        setFormData(initialFormData);

        // A Planned/Executing line isn't always hard-deleted immediately (OPS-3072/OPS-3268): for a
        // non-superuser on an agreement that isn't Awarded+tracked, deleting it instead queues a
        // deletion change request and leaves the line intact (now unassigned, once the SC above is
        // gone). Say so accurately rather than claiming every chosen line was deleted.
        const pendingApproval = budgetLinesToDelete.filter((budgetLine) =>
            isDeletionRoutedToApproval(budgetLine, isSuperUser, tracksContractModifications)
        );
        const hardDeletedCount = budgetLinesToDelete.length - pendingApproval.length;

        const budgetLinesNote = hardDeletedCount > 0 ? " and its budget lines" : "";
        let message = `${selectedServicesComponent.display_title}${budgetLinesNote} ${hardDeletedCount > 0 ? "have" : "has"} been successfully deleted.`;
        if (pendingApproval.length > 0) {
            const plural = pendingApproval.length > 1;
            message += ` The deletion of ${plural ? `${pendingApproval.length} budget lines` : "1 budget line"} has been queued and will be sent to your Division Director for approval when you save, and ${plural ? "they are" : "it is"} unassigned from any Services Component in the meantime.`;
        }
        message += ` When you're done editing, click ${continueBtnText} below.`;

        setAlert({
            type: "success",
            message,
            isCloseable: false,
            isToastMessage: true
        });
    };

    /**
     *
     * @param {number} number
     */
    const handleDelete = (number) => {
        const index = servicesComponents.findIndex((component) => component.number === number);
        const selectedServicesComponent = servicesComponents[index];
        // Match a line by its SC number when it has one: moving a line to another SC updates the
        // number and leaves services_component_id stale until save. The id fallback only applies
        // once the SC itself has a persisted id: an unsaved new SC's id is undefined, and so is an
        // unassigned local budget line's services_component_id, so without this guard the two would
        // incorrectly match each other and the line would look like it belongs to the new SC
        // (OPS-3268).
        const isOnSelectedSc = (budgetLine) =>
            budgetLine.services_component_number != null
                ? budgetLine.services_component_number === selectedServicesComponent.number
                : selectedServicesComponent.id != null &&
                  budgetLine.services_component_id === selectedServicesComponent.id;
        const hasExecutingBudgetLines =
            selectedServicesComponent?.id != null &&
            nonDraftBudgetLines.some(
                (budgetLine) =>
                    isOnSelectedSc(budgetLine) &&
                    [BLI_STATUS.EXECUTING, BLI_STATUS.OBLIGATED].includes(budgetLine.status)
            );
        if (hasExecutingBudgetLines) {
            setAlert({
                type: "error",
                heading: "This services component can't be deleted",
                message: HAS_EXECUTING_BUDGET_LINES_MESSAGE,
                isCloseable: false,
                isToastMessage: true
            });
            return;
        }

        // Every budget line on this SC, not just non-draft ones (OPS-3268 UX feedback item): an
        // empty SC deletes with no prompt, and Draft/Planned lines get their own delete-or-keep
        // choice. OBE lines are always kept, so they're excluded here and ride through the
        // default "keep" path below regardless of which button the user picks. Computed before the
        // PoP check below so a simultaneous PoP conflict doesn't silently skip the Draft/Planned
        // choice (OPS-3268).
        //
        // A line with a pending, unapproved change request (in_review) -- or one locked by a
        // submitted, undecided Modified-LOE contract-modification request (_meta.isDeletable
        // false; a separate lock from in_review, OPS-3072) -- is also excluded from the delete
        // set, the same way the standalone per-line delete icon already refuses both
        // (BLIRow.jsx:71,88, backed by the backend's compute_bli_editable/
        // _validate_not_in_review_modification, which force isDeletable false for every user
        // including superusers). Without this, "Delete budget lines" could bundle a deletable
        // line with a locked one into one Promise.all save: the deletable line's DELETE commits
        // immediately while the locked line's 400s, so the batch partially and silently succeeds
        // with no rollback. Treating a locked line like OBE -- always kept/unassigned, never
        // offered for deletion -- avoids that partial-delete outcome entirely.
        const allMatchedBudgetLines = allBudgetLines.filter(isOnSelectedSc);
        const draftOrPlannedBudgetLines = allMatchedBudgetLines.filter(
            (budgetLine) =>
                !budgetLine.is_obe &&
                !budgetLine.in_review &&
                budgetLine._meta?.isDeletable !== false &&
                [BLI_STATUS.DRAFT, BLI_STATUS.PLANNED].includes(budgetLine.status)
        );

        const remainingServicesComponents = servicesComponents.filter((component) => component.number !== number);
        const popCheck = popValidationSuite.run({
            mode: "delete",
            allServicesComponents: remainingServicesComponents,
            nonDraftBudgetLines
        });
        const hasPopConflict = popCheck.hasErrors();

        if (allMatchedBudgetLines.length === 0) {
            if (hasPopConflict) {
                setShowModal(true);
                setModalProps({
                    heading: POP_DELETE_CONFIRMATION_MESSAGE,
                    actionButtonText: "Continue with Deletion",
                    secondaryButtonText: "Cancel",
                    handleConfirm: () => performDelete(selectedServicesComponent)
                });
                return;
            }
            performDelete(selectedServicesComponent);
            return;
        }

        if (draftOrPlannedBudgetLines.length > 0) {
            setShowModal(true);
            setModalProps({
                heading: hasPopConflict
                    ? `Delete ${selectedServicesComponent.display_title}?`
                    : `Delete ${selectedServicesComponent.display_title}'s Draft and Planned budget lines too?`,
                description: hasPopConflict
                    ? "Deleting this Services Component will alter the agreement’s overall Period of Performance, and it has Draft and/or Planned budget lines. Some budget lines will need an updated Obligate By Date. Choose whether to also delete the Draft and/or Planned lines, or keep them unassigned."
                    : "This Services Component has Draft and/or Planned budget lines. Choose whether to delete them along with it, or keep them unassigned.",
                actionButtonText: "Delete",
                tertiaryButtonText: "Keep",
                secondaryButtonText: "Cancel",
                handleConfirm: () => performDelete(selectedServicesComponent, draftOrPlannedBudgetLines),
                handleTertiary: () => performDelete(selectedServicesComponent)
            });
            return;
        }

        if (hasPopConflict) {
            setShowModal(true);
            setModalProps({
                heading: POP_DELETE_CONFIRMATION_MESSAGE,
                actionButtonText: "Continue with Deletion",
                secondaryButtonText: "Cancel",
                handleConfirm: () => performDelete(selectedServicesComponent)
            });
            return;
        }

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete ${selectedServicesComponent.display_title}?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => performDelete(selectedServicesComponent)
        });
    };

    const handleCancel = (e) => {
        e.preventDefault();
        scFormSuite?.reset();
        popValidationSuite.reset();
        setFormData(initialFormData);
        setFormKey(Date.now());
    };

    const setFormDataById = (number) => {
        setFormKey(Date.now());
        const index = servicesComponents.findIndex((component) => component.number === number);
        const popStartDate = formatDateForScreen(servicesComponents[index].period_start);
        const popEndDate = formatDateForScreen(servicesComponents[index].period_end);
        const newFormData = {
            ...servicesComponents[index],
            popStartDate,
            popEndDate,
            mode: "edit"
        };
        setFormData(newFormData);
    };

    const servicesComponentsNumbers = servicesComponents.map((component) => component.number);

    return {
        serviceTypeReq,
        setServiceTypeReq,
        formData,
        setFormData,
        servicesComponents,
        showModal,
        setShowModal,
        modalProps,
        setModalProps,
        setAlert,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById,
        servicesComponentsNumbers,
        formKey,
        deleteCount
    };
};

export default useServicesComponents;
