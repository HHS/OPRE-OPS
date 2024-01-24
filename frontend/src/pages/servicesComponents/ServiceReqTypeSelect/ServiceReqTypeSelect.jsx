// import React from "react";
import Select from "../Select";

function ServiceReqTypeSelect({ value, onChange }) {
    return (
        <Select
            name="serviceReqType"
            label="Service Request Type"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption="Select a Service Request Type"
            options={["Severable", "Non-Severable"]}
        />
    );
}

export default ServiceReqTypeSelect;
