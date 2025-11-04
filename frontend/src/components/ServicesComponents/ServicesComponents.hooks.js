import React from "react";
import {
    useAddServicesComponentMutation,
    useDeleteServicesComponentMutation,
    useGetServicesComponentsListQuery,
    useUpdateServicesComponentMutation
} from "../../api/opsAPI";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";
import useAlert from "../../hooks/use-alert.hooks";
import { initialFormData, SERVICE_REQ_TYPES } from "./ServicesComponents.constants";
import { formatServiceComponent } from "./ServicesComponents.helpers";

/**
 * @param {number} agreementId - The ID of the agreement.
 * @param {Function} onUnsavedChangesChange - Callback to notify parent of unsaved changes.
 */
const useServicesComponents = (agreementId, onUnsavedChangesChange) => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState(SERVICE_REQ_TYPES.NON_SEVERABLE);
    const [formData, setFormData] = React.useState(initialFormData);
    const [servicesComponents, setServicesComponents] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [formKey, setFormKey] = React.useState(Date.now());
    const { setAlert } = useAlert();
    const [addServicesComponent] = useAddServicesComponentMutation();
    const [updateServicesComponent] = useUpdateServicesComponentMutation();
    const [deleteServicesComponent] = useDeleteServicesComponentMutation();
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

    // Notify parent when unsaved changes state changes
    React.useEffect(() => {
        if (onUnsavedChangesChange) {
            onUnsavedChangesChange(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, onUnsavedChangesChange]);
    const { data, isSuccess, error } = useGetServicesComponentsListQuery(agreementId);

    // Handle save function for navigation blocker - matches budget lines pattern
    // For now, Services components save immediately in handleSubmit, so this is a no-op
    // This prepares for future batching implementation
    const handleSave = React.useCallback(
        async (options = {}) => {
            const { showSuccessAlert = true, performNavigation = true } = options;
            try {
                // For now, Services components save immediately in handleSubmit
                // So this function just acknowledges the save and resets state
                setHasUnsavedChanges(false);

                if (showSuccessAlert) {
                    setAlert({
                        type: "success",
                        heading: "Services Components Saved",
                        message: "Your changes have been successfully saved.",
                        isCloseable: true
                    });
                }

                if (performNavigation) {
                    // Navigation will be handled by the navigation blocker
                    // This is where we could add custom navigation logic if needed
                }
            } catch (error) {
                console.error("Error saving services components:", error);
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while saving. Please try again.",
                    redirectUrl: "/error"
                });
                throw error;
            }
        },
        [setHasUnsavedChanges, setAlert]
    );

    // Navigation blocking is handled by parent component (CreateBLIsAndSCs)
    // to avoid conflicts with multiple blockers
    // The parent will track hasUnsavedChanges from this component
    React.useEffect(() => {
        if (isSuccess) {
            setServicesComponents(data);
        }
        if (error) {
            console.error("Error Fetching Services Components");
            console.error({ error });
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred. Please try again.",
                redirectUrl: "/error"
            });
        }
    }, [isSuccess, error, data, setAlert]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormKey(Date.now());
        let formattedServiceComponent = formatServiceComponent(formData.number, formData.optional, serviceTypeReq);
        const newFormData = {
            agreement_id: agreementId,
            number: Number(formData.number),
            optional: Boolean(formData.optional),
            description: formData.description,
            period_start: formatDateForApi(formData.popStartDate),
            period_end: formatDateForApi(formData.popEndDate)
        };
        const { id } = formData;

        if (formData.mode === "add") {
            addServicesComponent(newFormData)
                .unwrap()
                .then((fulfilled) => {
                    console.log("Created New Services Component:", fulfilled);
                    setHasUnsavedChanges(true);
                    setAlert({
                        type: "success",
                        message: `${formattedServiceComponent} has been successfully added. When you're done editing, click Save & Exit below.`,
                        isCloseable: false
                    });
                })
                .catch((rejected) => {
                    console.error("Error Creating Services Component");
                    console.error({ rejected });
                    setAlert({
                        type: "error",
                        heading: "Error",
                        message: "An error occurred. Please try again.",
                        redirectUrl: "/error"
                    });
                })
                .finally(() => {
                    setFormData(initialFormData);
                    setFormKey(Date.now());
                });
        }
        if (formData.mode === "edit") {
            updateServicesComponent({ id, data: newFormData })
                .unwrap()
                .then((fulfilled) => {
                    console.log("Updated Services Component:", fulfilled);
                    setHasUnsavedChanges(true);
                    setAlert({
                        type: "success",
                        message: `${formattedServiceComponent} has been successfully updated. When you're done editing, click Save & Exit below.`,
                        isCloseable: false
                    });
                })
                .catch((rejected) => {
                    console.error("Error Updating Services Component");
                    console.error({ rejected });
                    setAlert({
                        type: "error",
                        heading: "Error",
                        message: "An error occurred. Please try again.",
                        redirectUrl: "/error"
                    });
                })
                .finally(() => {
                    setFormData(initialFormData);
                    setFormKey(Date.now());
                });
        }
    };

    /**
     *
     * @param {number} id
     */
    const handleDelete = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const selectedServicesComponent = servicesComponents[index];

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete ${selectedServicesComponent.display_title}?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                deleteServicesComponent(id)
                    .unwrap()
                    .then((fulfilled) => {
                        setHasUnsavedChanges(true);
                        console.log("Deleted Services Component:", fulfilled);
                        setAlert({
                            type: "success",
                            message: `${selectedServicesComponent.display_title} has been successfully deleted. When you're done editing, click Save & Exit below.`,
                            isCloseable: false
                        });
                    })
                    .catch((rejected) => {
                        console.error("Error Deleting Services Component");
                        console.error({ rejected });
                        setAlert({
                            type: "error",
                            heading: "Error",
                            message: "An error occurred. Please try again.",
                            redirectUrl: "/error"
                        });
                    })
                    .finally(() => {
                        setShowModal(false);
                        setFormKey(Date.now());
                        setFormData(initialFormData);
                    });
            }
        });
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setFormData(initialFormData);
        setFormKey(Date.now());
    };

    const setFormDataById = (id) => {
        setFormKey(Date.now());
        const index = servicesComponents.findIndex((component) => component.id === id);
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
        setServicesComponents,
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
        hasUnsavedChanges,
        handleSave
    };
};

export default useServicesComponents;
