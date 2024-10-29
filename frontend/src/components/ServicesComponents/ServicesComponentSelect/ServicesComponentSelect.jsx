import PropTypes from "prop-types";
import Select from "../../UI/Form/Select";

/**
 * ServicesComponentSelect is a functional component that renders a Select component.
 *
 * @component
 * @param {Object} props - The properties that define the component.
 * @param {(string|number)} props.value - The current value of the select component.
 * @param {Function} props.onChange - The function to be called when the select value changes.
 * @param {Array<Object>} props.options - The options for the select component. Each option is an object with a 'value' and 'label'.
 * @param {boolean} props.isRequired - Indicates if the select component is required.
 * @param {Object} [props.rest] - Any additional properties to pass to the Select component. optional
 *
 * @returns {JSX.Element} The Select component.
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

ServicesComponentSelect.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            label: PropTypes.string
        })
    ).isRequired,
    isRequired: PropTypes.bool
};

export default ServicesComponentSelect;
