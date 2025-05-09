import Select from "../../UI/Form/Select";
/**
 * @typedef {Object} Option
 * @property {string} label
 * @property {number} value
 */

/**
 * ServicesComponentSelect is a functional component that renders a Select component.
 *
 * @component
 * @param {Object} props - The properties that define the component.
 * @param {(string|number)} props.value - The current value of the select component.
 * @param {Function} props.onChange - The function to be called when the select value changes.
 * @param {Option[]} props.options - The options for the select component.
 * @param {boolean} props.isRequired - Indicates if the select component is required.
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component. optional
 *
 * @returns {React.ReactElement} The Select component.
 */
function ServicesComponentSelect({ value, onChange, options, isRequired, ...rest }) {
    return (
        <Select
            name="servicesComponentSelect"
            label="Services Component"
            onChange={onChange}
            value={value}
            messages={[]}
            defaultOption=""
            options={options}
            isRequired={isRequired}
            isRequiredNoShow={true}
            {...rest}
        />
    );
}

export default ServicesComponentSelect;
