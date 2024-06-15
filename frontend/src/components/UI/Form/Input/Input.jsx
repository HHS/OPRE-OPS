import PropTypes from "prop-types";
import cx from "clsx";
import IsRequiredHelper from "../IsRequiredHelper";
/**
 * A form input component.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.value] - The value of the input field.(optional)
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.isRequired] - A flag to indicate if the input is required (optional).
 * @param {number} [props.maxLength] - The maximum number of characters allow (optional).
 * @returns {JSX.Element} - The rendered input component.
 */
const Input = ({
    name,
    label = name,
    onChange,
    pending = false,
    messages = [],
    value,
    className,
    isRequired = false,
    maxLength
}) => {
    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label
                className={`usa-label ${messages.length ? "usa-label--error" : ""} `}
                htmlFor={name}
            >
                {label}
            </label>
            {messages.length ? (
                <span
                    className="usa-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            ) : (
                <IsRequiredHelper isRequired={isRequired} />
            )}
            <input
                id={name}
                name={name}
                className={`usa-input ${messages.length ? "usa-input--error" : ""} `}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                value={value}
                maxLength={maxLength}
            />
        </div>
    );

    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

Input.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    pending: PropTypes.bool,
    messages: PropTypes.array,
    value: PropTypes.string,
    className: PropTypes.string,
    isRequired: PropTypes.bool,
    maxLength: PropTypes.number
};

export default Input;
