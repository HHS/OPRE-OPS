import cx from "clsx";
// import { convertCodeForDisplay } from "../../../helpers/utils";

/**
 * A select input for building select inputs.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {string} props.value - The currently selected option
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {Array<Object>} [props.options] - An array of options to display (optional).
 * @param {boolean} [props.valueOverride] - A flag to indicate if the value should be an index (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {string} [props.defaultOption] - The default option to display (optional).
 * @returns {JSX.Element} - The rendered component.
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
    valueOverride = false,
    className,
    defaultOption = "Select an option"
}) => {
    function handleChange(e) {
        onChange(name, e.target.value);
    }
    return (
        <fieldset className={cx("usa-fieldset", pending && "pending", className)}>
            <label
                className={`usa-label margin-top-0 ${messages.length ? "usa-label--error" : ""} `}
                htmlFor={name}
            >
                {label}
            </label>
            {messages.length > 0 && (
                <span
                    className="usa-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            )}
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    id={name}
                    className={`usa-select margin-top-0 width-card-lg ${messages.length ? "usa-input--error" : ""}`}
                    name={name}
                    onChange={handleChange}
                    value={value}
                >
                    <option value={null}>- {defaultOption} -</option>
                    {options.map((option, index) => (
                        <option
                            key={index + 1}
                            value={valueOverride ? index + 1 : option?.value}
                        >
                            {option?.label ?? option}
                        </option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
};

export default Select;
