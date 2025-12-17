import cx from "clsx";
import IsRequiredHelper from "../IsRequiredHelper";
/**
 * @typedef {Object} Option
 * @property {string} label - The label of the option.
 * @property {number | string} value - The value of the option.
 * @property {boolean} [disabled] - Whether the option is disabled (optional).
 */

/**
 * @component A base-level UI select input for building select inputs.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {number | string} props.value - The currently selected option
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {string[]} [props.messages] - An array of error messages to display (optional).
 * @param {Option[]} [props.options] - An array of options to display (optional).
 * @param {boolean} [props.valueOverride] - A flag to indicate if the value should be an index (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the legend (optional).
 * @param {string} [props.defaultOption] - The default option to display (optional).
 * @param {boolean} [props.isRequired] - A flag to indicate if the input is required (optional).
 * @param {boolean} [props.isRequiredNoShow] - A flag to indicate if the input is required but should not show (optional).
 * @param {boolean} [props.isDisabled] - A flag to indicate if the input is disabled (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
const Select = ({
    name,
    label = name,
    value,
    onChange,
    pending = false,
    messages = [],
    options = [
        {
            label: "Option 1",
            value: "OPTION_1"
        },
        {
            label: "Option 2",
            value: "OPTION_2"
        }
    ],
    className,
    legendClassname,
    defaultOption = "-Select an option-",
    isRequired = false,
    isRequiredNoShow = false,
    isDisabled = false
}) => {
    function handleChange(e) {
        onChange(name, e.target.value);
    }

    return (
        <fieldset
            className={cx("usa-fieldset", pending && "pending", className)}
            data-testid="select-fieldset"
            disabled={isDisabled}
        >
            <label
                className={`usa-label margin-top-0 ${legendClassname ? legendClassname : ""} ${messages.length ? "usa-label--error" : ""} `}
                htmlFor={name}
            >
                {label}
            </label>
            {messages.length > 0 ? (
                <span
                    className="usa-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            ) : (
                <IsRequiredHelper
                    isRequired={isRequired}
                    isRequiredNoShow={isRequiredNoShow}
                />
            )}
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    id={name}
                    className={`usa-select margin-top-0 ${messages.length ? "usa-input--error" : ""}`}
                    name={name}
                    onChange={handleChange}
                    value={value}
                    required={isRequired}
                >
                    <option value={null}>{defaultOption}</option>
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
};

export default Select;
