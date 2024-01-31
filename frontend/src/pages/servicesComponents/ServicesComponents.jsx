import React from "react";
import App from "../../App";
import ServiceReqTypeSelect from "./ServiceReqTypeSelect";
import ServicesComponentForm from "./ServicesComponentForm";
import ServicesComponentsList from "./ServicesComponentsList";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";

const ServicesComponents = () => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState("");
    const [formData, setFormData] = React.useState(initialFormData);
    const [servicesComponents, setServicesComponents] = React.useState([initialServicesComponent]);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.mode === "add") {
            const newFormData = {
                id: crypto.randomUUID(),
                ...formData
            };
            setServicesComponents([...servicesComponents, newFormData]);
            alert("Form submitted");
            setFormData(initialFormData);
        }
        if (formData.mode === "edit") {
            handleEdit(formData.id);
            alert("Services Component updated");
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

    return (
        <App breadCrumbName="Playground">
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <section>
                <h1>Services Components Playground</h1>
                <ServiceReqTypeSelect
                    value={serviceTypeReq}
                    onChange={(name, value) => {
                        setServiceTypeReq(value);
                        setFormData(initialFormData);
                    }}
                />
                <ServicesComponentForm
                    serviceTypeReq={serviceTypeReq}
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    handleCancel={handleCancel}
                />
                {import.meta.env.DEV && (
                    <section className="border-dashed border-emergency margin-top-6">
                        <h2 className="margin-0">Form Data</h2>
                        <pre>{JSON.stringify(formData, null, 2)}</pre>
                    </section>
                )}
            </section>
            <ServicesComponentsList
                servicesComponents={servicesComponents}
                setFormDataById={setFormDataById}
                handleDelete={handleDelete}
            />
        </App>
    );
};

const initialServicesComponent = {
    id: "9ab46509-8a3c-498a-998d-b40e78df5cd3",
    servicesComponent: "SC1",
    optional: false,
    popStartMonth: "3",
    popStartDay: "15",
    popStartYear: "2024",
    popEndMonth: "1",
    popEndDay: "15",
    popEndYear: "2025",
    description:
        "Develop a theory of change and identify ways to improve the program through continuous user feedback and engagement"
};

const initialFormData = {
    servicesComponent: "",
    optional: "",
    popStartMonth: "",
    popStartDay: "",
    popStartYear: "",
    popEndMonth: "",
    popEndDay: "",
    popEndYear: "",
    description: "",
    mode: "add"
};

export default ServicesComponents;
