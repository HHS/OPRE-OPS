import Select from "../Select";

function ServiceReqTypeSelect({ value, onChange }) {
    return (
        <Select
            name="serviceReqType"
            label="Service Requirement Type"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption="Select a Service Requirement Type"
            options={["Severable", "Non-Severable"]}
        />
    );
}

export default ServiceReqTypeSelect;
