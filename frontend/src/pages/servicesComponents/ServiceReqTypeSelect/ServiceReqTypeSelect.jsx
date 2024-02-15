import Select from "../Select";

function ServiceReqTypeSelect({ value, onChange, ...rest }) {
    return (
        <Select
            name="serviceReqType"
            label="Service Requirement Type"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption="Select a Service Requirement Type"
            options={SERVICE_REQ_TYPES_OPTIONS}
            {...rest}
        />
    );
}

const SERVICE_REQ_TYPES_OPTIONS = [
    {
        label: "Non-Severable",
        value: "NON_SEVERABLE"
    },
    {
        label: "Severable",
        value: "SEVERABLE"
    }
];

export default ServiceReqTypeSelect;
