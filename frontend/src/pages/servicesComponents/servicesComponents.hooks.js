import React from "react";
import useAlert from "../../hooks/use-alert.hooks";
import { initialFormData, backendServicesComponents } from "./servicesComponents.constants";
import { dateToYearMonthDay, formatServiceComponent } from "./servicesComponents.helpers";
import {
    useAddServicesComponentMutation,
    useUpdateServicesComponentMutation,
    useGetServicesComponentsListQuery
} from "../../api/opsAPI";

const useServicesComponents = (serviceRequirementType, agreementId) => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState(backendServicesComponents.serviceReqType);
    const [formData, setFormData] = React.useState(initialFormData);
    const [servicesComponents, setServicesComponents] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const { setAlert } = useAlert();
    const [addServicesComponent] = useAddServicesComponentMutation();

    // get all services components by agreement id
    const { data, isSuccess, error, isLoading } = useGetServicesComponentsListQuery(1);

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
                navigateUrl: "/error"
            });
        }
    }, [isSuccess, error, data, setAlert]);

    const handleSubmit = (e) => {
        // NOTE: Services Components here: https://github.com/HHS/OPRE-OPS/pull/1927
        e.preventDefault();
        let formattedServiceComponent = formatServiceComponent(formData.number, formData.optional, serviceTypeReq);

        if (formData.mode === "add") {
            const newFormData = {
                // id: crypto.randomUUID(),
                contract_agreement_id: agreementId,
                number: Number(formData.number),
                optional: Boolean(formData.optional),
                description: formData.description,
                period_start: `${formData.popStartYear}-${formData.popStartMonth}-${formData.popStartDay}`,
                period_end: `${formData.popEndYear}-${formData.popEndMonth}-${formData.popEndDay}`
            };
            setServicesComponents([...servicesComponents, newFormData]);

            // eslint-disable-next-line no-unused-vars
            addServicesComponent(newFormData)
                .unwrap()
                .then((fulfilled) => {
                    console.log("Created New Services Component:", fulfilled);
                })
                .catch((rejected) => {
                    console.error("Error Creating Services Component");
                    console.error({ rejected });
                    setAlert({
                        type: "error",
                        heading: "Error",
                        message: "An error occurred. Please try again.",
                        navigateUrl: "/error"
                    });
                });

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
            number: Number(formData.number),
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
        } = dateToYearMonthDay(servicesComponents[index].period_start);
        const {
            year: popEndYear,
            month: popEndMonth,
            day: popEndDay
        } = dateToYearMonthDay(servicesComponents[index].period_end);
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
