import React from "react";
import useAlert from "../../hooks/use-alert.hooks";
import { initialFormData, backendServicesComponents } from "./servicesComponents.constants";
import { dateToYearMonthDay, formatServiceComponent } from "./servicesComponents.helpers";

const useServicesComponents = () => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState(backendServicesComponents.serviceReqType);
    const [formData, setFormData] = React.useState(initialFormData);
    const [servicesComponents, setServicesComponents] = React.useState(backendServicesComponents.servicesComponents);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const { setAlert } = useAlert();

    const handleSubmit = (e) => {
        e.preventDefault();
        let formattedServiceComponent = formatServiceComponent(
            formData.servicesComponent,
            formData.optional,
            serviceTypeReq
        );

        if (formData.mode === "add") {
            const newFormData = {
                id: crypto.randomUUID(),
                servicesComponent: Number(formData.servicesComponent),
                optional: Boolean(formData.optional),
                popStartDate: `${formData.popStartYear}-${formData.popStartMonth}-${formData.popStartDay}`,
                popEndDate: `${formData.popEndYear}-${formData.popEndMonth}-${formData.popEndDay}`,
                description: formData.description
            };
            setServicesComponents([...servicesComponents, newFormData]);
            setAlert({
                type: "success",
                heading: "Services Component Created",
                message: `${formattedServiceComponent} has been successfully added.`
            });
            setFormData(initialFormData);
        }
        if (formData.mode === "edit") {
            handleEdit(formData.id);
            setAlert({
                type: "success",
                heading: "Services Component Updated",
                message: `${formattedServiceComponent} has been successfully updated.`
            });
            setFormData(initialFormData);
        }
    };

    const handleEdit = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const newServicesComponents = [...servicesComponents];
        const newFormData = { ...formData, mode: "add" };
        newServicesComponents[index] = {
            ...servicesComponents[index],
            servicesComponent: Number(formData.servicesComponent),
            optional: Boolean(formData.optional),
            popStartDate: `${formData.popStartYear}-${formData.popStartMonth}-${formData.popStartDay}`,
            popEndDate: `${formData.popEndYear}-${formData.popEndMonth}-${formData.popEndDay}`,
            description: formData.description
        };
        setServicesComponents(newServicesComponents);
        setFormData(newFormData);
    };

    const handleDelete = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const selectedServicesComponent = servicesComponents[index];
        const newServicesComponents = servicesComponents.filter((component) => component.id !== id);

        let formattedServiceComponent = formatServiceComponent(
            selectedServicesComponent.servicesComponent,
            selectedServicesComponent.optional,
            serviceTypeReq
        );
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete ${formattedServiceComponent}?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                setServicesComponents(newServicesComponents);
                setAlert({
                    type: "success",
                    heading: "Services Component Deleted",
                    message: `${formattedServiceComponent} has been successfully deleted.`
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
        const {
            year: popStartYear,
            month: popStartMonth,
            day: popStartDay
        } = dateToYearMonthDay(servicesComponents[index].popStartDate);
        const {
            year: popEndYear,
            month: popEndMonth,
            day: popEndDay
        } = dateToYearMonthDay(servicesComponents[index].popEndDate);
        const newFormData = {
            ...servicesComponents[index],
            popEndYear,
            popEndMonth,
            popEndDay,
            popStartYear,
            popStartMonth,
            popStartDay,
            mode: "edit"
        };
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
