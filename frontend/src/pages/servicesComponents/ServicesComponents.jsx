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
        description: ""
    });
    const [servicesComponents, setServicesComponents] = React.useState([initialServicesComponent]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: add an unique id to each services component
        const newFormData = { ...formData };
        setServicesComponents([...servicesComponents, newFormData]);
        alert("Form submitted");
        setFormData({});
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
            <ServicesComponentsList servicesComponents={servicesComponents} />
        </App>
    );
};

const initialServicesComponent = {
    servicesComponent: "SC1",
    optional: false,
    popStartMonth: "03",
    popStartDay: "15",
    popStartYear: "2024",
    popEndMonth: "01",
    popEndDay: "15",
    popEndYear: "2025",
    description:
        "Develop a theory of change and identify ways to improve the program through continuous user feedback and engagement"
};

export default ServicesComponents;
