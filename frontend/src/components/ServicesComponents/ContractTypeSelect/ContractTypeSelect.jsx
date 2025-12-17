import Select from "../../UI/Form/Select";
import { CONTRACT_TYPE_OPTIONS } from "../ServicesComponents.constants";

/**
 * ContractTypeSelect component.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.value - The current value of the select.
 * @param {Function} props.onChange - Function to call when the select value changes.
 * @param {boolean} props.isDisabled - Whether the select is disabled.
 * @param {Object} props.rest - Additional props to pass to the Select component.
 *
 * @returns {React.ReactElement} The rendered component.
 */
function ContractTypeSelect({ value, onChange, isDisabled, ...rest }) {
    return (
        <Select
            name="contract-type"
            label="Contract Type"
            onChange={onChange}
            value={value}
            messages={[]}
            options={CONTRACT_TYPE_OPTIONS}
            isDisabled={isDisabled}
            {...rest}
        />
    );
}

export default ContractTypeSelect;
