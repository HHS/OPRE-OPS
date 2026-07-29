import React from "react";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";
import useAlert from "../../hooks/use-alert.hooks";
import { useEditAgreement, useEditAgreementDispatch } from "../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import { initialFormData } from "./GrantNumbers.constants";

/**
 * @param {number} agreementId - The ID of the agreement.
 * @param {string} continueBtnText - The text to display on the "Continue" button.
 */
const useGrantNumbers = (agreementId, continueBtnText, setHasUnsavedChanges) => {
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
    const { grant_numbers: grantNumbers } = useEditAgreement() || {};

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormKey(Date.now());
        const displayTitle = `Grant ${formData.number}`;
        let newFormData = {
            agreement_id: agreementId,
            number: Number(formData.number),
            description: formData.description,
            period_start: formatDateForApi(formData.popStartDate),
            period_end: formatDateForApi(formData.popEndDate),
            display_title: displayTitle
        };

        if (formData.mode === "add") {
            dispatch({
                type: "ADD_GRANT_NUMBER",
                payload: newFormData
            });
            setHasUnsavedChanges(true);
            setFormData(initialFormData);
            setFormKey(Date.now());
            setAlert({
                type: "success",
                message: `${displayTitle} has been successfully added. When you're done editing, click ${continueBtnText} below.`,
                isCloseable: false,
                isToastMessage: true
            });
        }
        if (formData.mode === "edit") {
            newFormData.has_changed = true;
            dispatch({
                type: "UPDATE_GRANT_NUMBER",
                payload: { ...formData, ...newFormData }
            });
            setHasUnsavedChanges(true);
            setFormData(initialFormData);
            setFormKey(Date.now());
            setAlert({
                type: "success",
                message: `${displayTitle} has been successfully updated. When you're done editing, click ${continueBtnText} below.`,
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
        const index = grantNumbers.findIndex((item) => item.number === number);
        const selectedGrantNumber = grantNumbers[index];

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete ${selectedGrantNumber.display_title}?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                dispatch({
                    type: "DELETE_GRANT_NUMBER",
                    payload: selectedGrantNumber
                });
                setHasUnsavedChanges(true);
                setShowModal(false);
                setFormKey(Date.now());
                setFormData(initialFormData);
                setAlert({
                    type: "success",
                    message: `${selectedGrantNumber.display_title} has been successfully deleted. When you're done editing, click ${continueBtnText} below.`,
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
        const index = grantNumbers.findIndex((item) => item.number === number);
        const popStartDate = formatDateForScreen(grantNumbers[index].period_start);
        const popEndDate = formatDateForScreen(grantNumbers[index].period_end);
        const newFormData = {
            ...grantNumbers[index],
            popStartDate,
            popEndDate,
            mode: "edit"
        };
        setFormData(newFormData);
    };

    const grantNumbersNumbers = grantNumbers.map((item) => item.number);

    return {
        formData,
        setFormData,
        grantNumbers,
        showModal,
        setShowModal,
        modalProps,
        setModalProps,
        setAlert,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById,
        grantNumbersNumbers,
        formKey
    };
};

export default useGrantNumbers;
