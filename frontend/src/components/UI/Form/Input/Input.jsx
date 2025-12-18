import cx from "clsx";
import IsRequiredHelper from "../IsRequiredHelper";
import Tooltip from "../../USWDS/Tooltip";
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
 * @param {boolean} [props.isDisabled] - A flag to indicate if the input is disabled (optional).
 * @param {number} [props.maxLength] - The maximum number of characters allow (optional).
 * @param {string} [props.tooltipMsg] - Tooltip message
 * @returns {React.ReactElement} - The rendered input component.
 */
const Input = ({
    name,
    label = name,
    onChange,
    pending = false,
    messages = [],
    value,
    className,
    maxLength,
    isRequired = false,
    isDisabled = false,
    tooltipMsg = ""
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
            {isDisabled ? (
                <Tooltip
                    label={tooltipMsg}
                    position="right"
                >
                    <input
                        id={name}
                        name={name}
                        className="usa-input width-mobile-lg"
                        autoComplete="off"
                        autoCorrect="off"
                        value={value}
                        maxLength={maxLength}
                        disabled={isDisabled}
                    />
                </Tooltip>
            ) : (
                <input
                    id={name}
                    name={name}
                    className={`usa-input ${messages.length ? "usa-input--error" : ""} `}
                    onChange={handleChange}
                    autoComplete="off"
                    autoCorrect="off"
                    value={value}
                    maxLength={maxLength}
                    disabled={isDisabled}
                />
            )}
        </div>
    );

    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

export default Input;
