import Select from "../../UI/Select";
import PropTypes from "prop-types";
import { SERVICE_REQ_TYPES_OPTIONS } from "../ServicesComponents.constants";

/**
 * ServiceReqTypeSelect is a select component for choosing a service requirement type.
 *
 * @component
 * @param {Object} props - The properties that define the ServiceReqTypeSelect component.
 * @param {string} props.value - The current value of the select component.
 * @param {Function} props.onChange - The function to call when the select value changes.
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component. optional
 * @returns {JSX.Element} The ServiceReqTypeSelect component.
 */
function ServiceReqTypeSelect({ value, onChange, ...rest }) {
    return (
        <Select
            name="serviceReqType"
            label="Service Requirement Type"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption="-Select Service Requirement Type-"
            options={SERVICE_REQ_TYPES_OPTIONS}
            {...rest}
        />
    );
}

ServiceReqTypeSelect.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    rest: PropTypes.object
};

export default ServiceReqTypeSelect;
