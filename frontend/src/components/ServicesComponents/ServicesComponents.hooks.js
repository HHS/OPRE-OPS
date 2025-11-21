import React from "react";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";
import useAlert from "../../hooks/use-alert.hooks";
import { useEditAgreement, useEditAgreementDispatch } from "../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import { initialFormData } from "./ServicesComponents.constants";
import { formatServiceComponent } from "./ServicesComponents.helpers";

/**
 * @param {number} agreementId - The ID of the agreement.
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} serviceRequirementType - The type of service requirement.
 * @param {string} continueBtnText - The text to display on the "Continue" button.

 */
const useServicesComponents = (agreementId, serviceRequirementType, continueBtnText) => {
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
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
    const { setAlert } = useAlert();

    const dispatch = useEditAgreementDispatch();
    const { services_components: servicesComponents } = useEditAgreement() || {};

    const handleSubmit = (e) => {
        e.preventDefault();
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

    /**
     *
     * @param {number} number
     */
    const handleDelete = (number) => {
        const index = servicesComponents.findIndex((component) => component.number === number);
        const selectedServicesComponent = servicesComponents[index];

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete ${selectedServicesComponent.display_title}?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                dispatch({
                    type: "DELETE_SERVICE_COMPONENT",
                    payload: selectedServicesComponent
                });
                setHasUnsavedChanges(true);
                setShowModal(false);
                setFormKey(Date.now());
                setFormData(initialFormData);
                setAlert({
                    type: "success",
                    message: `${selectedServicesComponent.display_title} has been successfully deleted. When you're done editing, click Save & Exit below.`,
                    isCloseable: false,
                    isToastMessage: true
                });
            }
        });
    };

    const handleCancel = (e) => {
        e.preventDefault();
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
        hasUnsavedChanges
    };
};

export default useServicesComponents;
