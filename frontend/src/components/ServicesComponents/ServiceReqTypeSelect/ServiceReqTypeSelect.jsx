import Select from "../../UI/Form/Select";
import { SERVICE_REQ_TYPES_OPTIONS } from "../ServicesComponents.constants";

/**
 * ServiceReqTypeSelect is a select component for choosing a service requirement type.
 *
 * @component
 * @param {Object} props - The properties that define the ServiceReqTypeSelect component.
 * @param {string} props.value - The current value of the select component.
 * @param {Function} props.onChange - The function to call when the select value changes.
 * @param {boolean} [props.isDisabled=false] - Whether the select component is disabled. optional
 * @param {string} [props.tooltipMsg=""] - Tooltip message to display (optional).
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component. optional
 * @returns {React.ReactElement} The ServiceReqTypeSelect component.
 */
function ServiceReqTypeSelect({ value, onChange, isDisabled = false, tooltipMsg = "", ...rest }) {
    return (
        <Select
            name="service_requirement_type"
            label="Service Requirement Type"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption="-Select Service Requirement Type-"
            options={SERVICE_REQ_TYPES_OPTIONS}
            isDisabled={isDisabled}
            tooltipMsg={tooltipMsg}
            {...rest}
        />
    );
}

export default ServiceReqTypeSelect;
