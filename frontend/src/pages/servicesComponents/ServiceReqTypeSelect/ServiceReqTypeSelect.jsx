import Select from "../Select";
import { SERVICE_REQ_TYPES } from "../servicesComponents.constants";

function ServiceReqTypeSelect({ value, onChange }) {
    return (
        <Select
            name="serviceReqType"
            label="Service Requirement Type"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption="Select a Service Requirement Type"
            options={[SERVICE_REQ_TYPES.SEVERABLE, SERVICE_REQ_TYPES.NON_SEVERABLE]}
        />
    );
}

export default ServiceReqTypeSelect;
