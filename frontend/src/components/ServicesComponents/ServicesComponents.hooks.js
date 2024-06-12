import React from "react";
import useAlert from "../../hooks/use-alert.hooks";
import { initialFormData, SERVICE_REQ_TYPES } from "./ServicesComponents.constants";
import { formatServiceComponent } from "./ServicesComponents.helpers";
import {
    useAddServicesComponentMutation,
    useUpdateServicesComponentMutation,
    useGetServicesComponentsListQuery,
    useDeleteServicesComponentMutation
} from "../../api/opsAPI";
import { formatDateForApi, formatDateForScreen } from "../../helpers/utils";

const useServicesComponents = (agreementId) => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState(SERVICE_REQ_TYPES.NON_SEVERABLE);
    const [formData, setFormData] = React.useState(initialFormData);
    const [servicesComponents, setServicesComponents] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [formKey, setFormKey] = React.useState(Date.now());
    const { setAlert } = useAlert();
    const [addServicesComponent] = useAddServicesComponentMutation();
    const [updateServicesComponent] = useUpdateServicesComponentMutation();
    const [deleteServicesComponent] = useDeleteServicesComponentMutation();

    const { data, isSuccess, error } = useGetServicesComponentsListQuery(agreementId);

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
            contract_agreement_id: agreementId,
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
                    setAlert({
                        type: "success",
                        heading: "Services Component Created",
                        message: `${formattedServiceComponent} has been successfully added.`
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
                });

            setFormData(initialFormData);
        }
        if (formData.mode === "edit") {
            updateServicesComponent({ id, data: newFormData })
                .unwrap()
                .then((fulfilled) => {
                    console.log("Updated Services Component:", fulfilled);
                    setAlert({
                        type: "success",
                        heading: "Services Component Updated",
                        message: `${formattedServiceComponent} has been successfully updated.`
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
                });

            setFormData(initialFormData);
        }
    };

    const handleDelete = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const selectedServicesComponent = servicesComponents[index];

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete ${selectedServicesComponent.display_title}?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                deleteServicesComponent(id);
                setAlert({
                    type: "success",
                    heading: "Services Component Deleted",
                    message: `${selectedServicesComponent.display_title} has been successfully deleted.`
                });
                setFormData(initialFormData);
                setFormKey(Date.now());
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
        formKey
    };
};

export default useServicesComponents;
