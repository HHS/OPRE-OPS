import React from "react";
import { BLI_STATUS } from "../../helpers/budgetLines.helpers";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";
import useAlert from "../../hooks/use-alert.hooks";
import { useEditAgreement, useEditAgreementDispatch } from "../Agreements/AgreementEditor/AgreementEditorContext.hooks";
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
 */
const useServicesComponents = (
    agreementId,
    serviceRequirementType,
    continueBtnText,
    setHasUnsavedChanges,
    scFormSuite,
    nonDraftBudgetLines = [],
    allBudgetLines = []
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
        popValidationSuite.reset();
        setFormData(initialFormData);
        const budgetLinesNote = budgetLinesToDelete.length > 0 ? " and its budget lines" : "";
        setAlert({
            type: "success",
            message: `${selectedServicesComponent.display_title}${budgetLinesNote} ${budgetLinesToDelete.length > 0 ? "have" : "has"} been successfully deleted. When you're done editing, click ${continueBtnText} below.`,
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
        // number and leaves services_component_id stale until save.
        const isOnSelectedSc = (budgetLine) =>
            budgetLine.services_component_number != null
                ? budgetLine.services_component_number === selectedServicesComponent.number
                : budgetLine.services_component_id === selectedServicesComponent.id;
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
        const remainingServicesComponents = servicesComponents.filter((component) => component.number !== number);

        const popCheck = popValidationSuite.run({
            mode: "delete",
            allServicesComponents: remainingServicesComponents,
            nonDraftBudgetLines
        });

        if (popCheck.hasErrors()) {
            setShowModal(true);
            setModalProps({
                heading: POP_DELETE_CONFIRMATION_MESSAGE,
                actionButtonText: "Continue with Deletion",
                secondaryButtonText: "Cancel",
                handleConfirm: () => performDelete(selectedServicesComponent)
            });
            return;
        }

        // Every budget line on this SC, not just non-draft ones (OPS-3268 UX feedback item): an
        // empty SC deletes with no prompt, and Draft/Planned lines get their own delete-or-keep
        // choice. OBE lines are always kept, so they're excluded here and ride through the
        // default "keep" path below regardless of which button the user picks.
        const allMatchedBudgetLines = allBudgetLines.filter(isOnSelectedSc);
        const draftOrPlannedBudgetLines = allMatchedBudgetLines.filter(
            (budgetLine) => !budgetLine.is_obe && [BLI_STATUS.DRAFT, BLI_STATUS.PLANNED].includes(budgetLine.status)
        );

        if (allMatchedBudgetLines.length === 0) {
            performDelete(selectedServicesComponent);
            return;
        }

        if (draftOrPlannedBudgetLines.length > 0) {
            setShowModal(true);
            setModalProps({
                heading: `${selectedServicesComponent.display_title} has Draft and/or Planned budget lines. Do you want to delete them too, or keep them unassigned from any Services Component?`,
                actionButtonText: "Delete budget lines",
                tertiaryButtonText: "Keep budget lines",
                secondaryButtonText: "Cancel",
                handleConfirm: () => performDelete(selectedServicesComponent, draftOrPlannedBudgetLines),
                handleTertiary: () => performDelete(selectedServicesComponent)
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
        formKey
    };
};

export default useServicesComponents;
