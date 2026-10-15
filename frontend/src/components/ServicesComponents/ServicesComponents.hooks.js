import React from "react";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";
import useAlert from "../../hooks/use-alert.hooks";
import { useEditAgreement, useEditAgreementDispatch } from "../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import { initialFormData } from "./ServicesComponents.constants";
import { formatServiceComponent } from "./ServicesComponents.helpers";
import popValidationSuite from "./ServicesComponentForm/popValidationSuite";

const POP_CONFIRMATION_MESSAGE =
    "Changing the Period of Performance dates will alter the agreement’s Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue updating this services component?";

const POP_DELETE_CONFIRMATION_MESSAGE =
    "Deleting this Services Component will alter the agreement’s overall Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue deleting this services component?";

/**
 * @param {number} agreementId - The ID of the agreement.
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} serviceRequirementType - The type of service requirement.
 * @param {string} continueBtnText - The text to display on the "Continue" button.
 * @param {Function} setHasUnsavedChanges - Function to mark the parent form dirty.
 * @param {import('vest').Suite<any, any>} [scFormSuite] - Vest suite for the SC form's required fields.
 * @param {import('../../types/BudgetLineTypes').BudgetLine[]} [nonDraftBudgetLines] - Non-draft BLIs used by the PoP validation suite.
 */
const useServicesComponents = (
    agreementId,
    serviceRequirementType,
    continueBtnText,
    setHasUnsavedChanges,
    scFormSuite,
    nonDraftBudgetLines = []
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
     * because there was no PoP conflict, or because the user confirmed the PoP-impact modal.
     * @param {object} selectedServicesComponent
     */
    const performDelete = (selectedServicesComponent) => {
        dispatch({
            type: "DELETE_SERVICE_COMPONENT",
            payload: selectedServicesComponent
        });
        setHasUnsavedChanges(true);
        setShowModal(false);
        setFormKey(Date.now());
        popValidationSuite.reset();
        setFormData(initialFormData);
        setAlert({
            type: "success",
            message: `${selectedServicesComponent.display_title} has been successfully deleted. When you're done editing, click ${continueBtnText} below.`,
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
