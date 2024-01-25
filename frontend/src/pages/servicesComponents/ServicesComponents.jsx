import React from "react";
import App from "../../App";
import ServiceReqTypeSelect from "./ServiceReqTypeSelect";
import ServicesComponentForm from "./ServicesComponentForm";

const ServicesComponents = () => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState("");
    const [formData, setFormData] = React.useState({
        servicesComponent: "",
        optional: false,
        popStartMonth: "",
        popStartDay: "",
        popStartYear: "",
        popEndMonth: "",
        popEndDay: "",
        popEndYear: "",
        description: ""
    });
    const [servicesComponents, setServicesComponents] = React.useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newFormData = { ...formData };
        setServicesComponents([...servicesComponents, newFormData]);
        alert("Form submitted");
        setFormData({});
    };

    return (
        <App breadCrumbName="Playground">
            <section className="border-dashed border-emergency ">
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
            </section>
            <section className="border-dashed border-green margin-top-6">
                <h2>Form Data</h2>
                <pre>{JSON.stringify(formData, null, 2)}</pre>
            </section>
            <section className="border-dashed border-green margin-top-6">
                <h2>Services Components</h2>
                <pre>{JSON.stringify(servicesComponents, null, 2)}</pre>
            </section>
        </App>
    );
};

export default ServicesComponents;
