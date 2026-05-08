import cx from "clsx";
import { useState, useEffect } from "react";
import CurrencyFormat from "react-currency-format";

/**
 * A form input component for currency values.
 * @description best used with  state that is not in object form, but as a string or number.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string | number} [props.value] - The value of the input field.(optional)
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {Function} [props.setEnteredAmount] - A function to call when the input value changes.
 * @param {string} [props.placeholder] - The placeholder text to display in the input
 * @returns {JSX.Element} - The rendered component.
 */
const CurrencyInput = ({
    name,
    label = name,
    onChange,
    pending = false,
    messages = [],
    value,
    className,
    setEnteredAmount,
    placeholder = "$",
    ...rest
}) => {
    // Internal display value tracks mid-entry states (e.g. trailing decimal "5.")
    // that would otherwise be stripped by the controlled value prop.
    const [displayValue, setDisplayValue] = useState(value ?? "");

    // Keep displayValue in sync when the external value changes (e.g. form reset).
    useEffect(() => {
        setDisplayValue(value ?? "");
    }, [value]);

    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label
                className={`usa-label ${messages.length ? "usa-label--error" : ""} `}
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
            <CurrencyFormat
                id={name}
                name={name}
                value={displayValue}
                className={`usa-input ${messages.length ? "usa-input--error" : ""} `}
                thousandSeparator={true}
                decimalScale={2}
                placeholder={placeholder}
                onValueChange={(values) => {
                    const { floatValue, value: rawValue } = values;
                    // Preserve internal display value so trailing decimals are not stripped.
                    setDisplayValue(rawValue);
                    // Notify parent of the raw string for uncontrolled-style updates.
                    onChange(name, rawValue);
                    // Notify caller of the resolved float (undefined becomes null).
                    if (setEnteredAmount) {
                        setEnteredAmount(typeof floatValue === "number" ? floatValue : null);
                    }
                }}
                {...rest}
            />
        </div>
    );
};

export default CurrencyInput;
