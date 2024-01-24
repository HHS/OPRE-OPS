import React from "react";
import App from "../../App";
import ServiceReqTypeSelect from "./ServiceReqTypeSelect";
import ServicesComponentForm from "./ServicesComponentForm";

const ServicesComponents = () => {
    const [serviceTypeReq, setServiceTypeReq] = React.useState("");
    const [serviceComponent, setServiceComponent] = React.useState({
        servicesComponent: "",
        optional: false,
        popStartMonth: "",
        popStartDay: "",
        popStartYear: "",
        popEndMonth: "",
        popEndDay: "",
        popEndYear: ""
    });
    return (
        <App breadCrumbName="Playground">
            <section className="border-dashed border-emergency ">
                <h1>Services Components Playground</h1>
                <ServiceReqTypeSelect
                    value={serviceTypeReq}
                    onChange={(name, value) => {
                        setServiceTypeReq(value);
                        setServiceComponent({});
                    }}
                />
                <ServicesComponentForm
                    serviceTypeReq={serviceTypeReq}
                    serviceComponent={serviceComponent}
                    setServiceComponent={setServiceComponent}
                />
            </section>
        </App>
    );
};

export default ServicesComponents;
