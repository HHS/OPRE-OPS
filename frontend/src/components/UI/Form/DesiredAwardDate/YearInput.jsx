import cx from "clsx";

/**
 * A form input component.
 *
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.value] - The value of the input field.(optional)
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {JSX.Element} - The rendered input component.
 */
const YearInput = ({ name, label = name, onChange, pending = false, messages = [], value, className }) => {
    return (
        <div className={cx("usa-form-group usa-form-group--year margin-top-0", pending && "pending", className)}>
            <label className={`usa-label sr-only ${messages.length ? "usa-label--error" : null} `} htmlFor={name}>
                {label}
            </label>
            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
            <input
                id={name}
                name={name}
                aria-describedby="mdHint"
                className={`usa-input ${messages.length ? "usa-input--error" : null} `}
                minLength={4}
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="YYYY"
                value={value}
                onChange={handleChange}
            />
        </div>
    );

    function handleChange(e) {
        if (e.target.value.match(/^[0-9]*$/)) {
            onChange(name, e.target.value);
        }
    }
};

export default YearInput;
