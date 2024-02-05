import React from "react";
import useAlert from "../../hooks/use-alert.hooks";
import { initialFormData, initialServicesComponent } from "./servicesComponents.constants";
import { addOInFront } from "./servicesComponents.helpers";

const useServicesComponents = () => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState("");
    const [formData, setFormData] = React.useState(initialFormData);
    const [servicesComponents, setServicesComponents] = React.useState([initialServicesComponent]);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const { setAlert } = useAlert();

    const handleSubmit = (e) => {
        e.preventDefault();
        let formattedServiceComponent = formData.servicesComponent;

        if (formData.optional) {
            formattedServiceComponent = addOInFront(formData.servicesComponent);
        }
        if (formData.mode === "add") {
            const newFormData = {
                id: crypto.randomUUID(),
                ...formData
            };
            setServicesComponents([...servicesComponents, newFormData]);
            setAlert({
                type: "success",
                heading: "Services Component Created",
                message: `The Services Component ${formattedServiceComponent} has been successfully added.`
            });
            setFormData(initialFormData);
        }
        if (formData.mode === "edit") {
            handleEdit(formData.id);
            setAlert({
                type: "success",
                heading: "Services Component Updated",
                message: `The Services Component ${formattedServiceComponent} has been successfully updated.`
            });
            setFormData(initialFormData);
        }
    };

    const handleEdit = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const newServicesComponents = [...servicesComponents];
        const newFormData = { ...formData, mode: "add" };
        newServicesComponents[index] = { ...servicesComponents[index], ...formData };
        setServicesComponents(newServicesComponents);
        setFormData(newFormData);
    };

    const handleDelete = (id) => {
        const newServicesComponents = servicesComponents.filter((component) => component.id !== id);
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to delete this Services Component?",
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                setServicesComponents(newServicesComponents);
                setAlert({
                    type: "success",
                    heading: "Services Component Deleted",
                    message: `The Services Component has been successfully deleted.`
                });
            }
        });
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setFormData(initialFormData);
    };

    const setFormDataById = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const newFormData = { ...servicesComponents[index], mode: "edit" };
        setFormData(newFormData);
    };

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
        handleEdit,
        handleDelete,
        handleCancel,
        setFormDataById
    };
};

export default useServicesComponents;
