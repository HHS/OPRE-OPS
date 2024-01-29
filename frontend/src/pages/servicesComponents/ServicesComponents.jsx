import React from "react";
import App from "../../App";
import ServiceReqTypeSelect from "./ServiceReqTypeSelect";
import ServicesComponentForm from "./ServicesComponentForm";
import ServicesComponentsList from "./ServicesComponentsList";

const ServicesComponents = () => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState("");
    const [formData, setFormData] = React.useState({
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
    });
    const [servicesComponents, setServicesComponents] = React.useState([initialServicesComponent]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.mode === "add") {
            const newFormData = {
                id: crypto.randomUUID(),
                ...formData
            };
            setServicesComponents([...servicesComponents, newFormData]);
            alert("Form submitted");
            setFormData({});
        }
        if (formData.mode === "edit") {
            handleEdit(formData.id);
            alert("Form edited");
            setFormData({});
        }
    };

    const handleEdit = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const newServicesComponents = [...servicesComponents];
        newServicesComponents[index] = { ...servicesComponents[index], ...formData };
        setServicesComponents(newServicesComponents);
        setFormData({});
    };

    const setFormDataById = (id) => {
        const index = servicesComponents.findIndex((component) => component.id === id);
        const newFormData = { ...servicesComponents[index], mode: "edit" };
        setFormData(newFormData);
    };

    return (
        <App breadCrumbName="Playground">
            <section>
                <h1>Services Components Playground</h1>
                <ServiceReqTypeSelect
                    value={serviceTypeReq}
                    onChange={(name, value) => {
                        setServiceTypeReq(value);
                        setFormData({});
                    }}
                />
                <ServicesComponentForm
                    serviceTypeReq={serviceTypeReq}
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                />
                {import.meta.env.DEV && (
                    <section className="border-dashed border-emergency margin-top-6">
                        <h2>Form Data</h2>
                        <pre>{JSON.stringify(formData, null, 2)}</pre>
                    </section>
                )}
            </section>
            <ServicesComponentsList
                servicesComponents={servicesComponents}
                setFormDataById={setFormDataById}
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

export default ServicesComponents;
