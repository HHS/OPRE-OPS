import cx from "clsx";
import { useState, useEffect, useRef } from "react";
import CurrencyInputField from "react-currency-input-field";

/**
 * A form input component for currency values.
 * @description best used with state that is not in object form, but as a string or number.
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
    // displayValue holds the raw typed string (e.g. "5.") so a trailing
    // decimal isn't stripped before the user finishes typing the cents.
    const [displayValue, setDisplayValue] = useState(value ?? "");
    // Set on each user keystroke so the parent's float echo doesn't
    // overwrite the in-progress display string on the next render.
    const skipNextSyncRef = useRef(false);

    useEffect(() => {
        if (skipNextSyncRef.current) {
            skipNextSyncRef.current = false;
            return;
        }
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
            <CurrencyInputField
                id={name}
                name={name}
                value={displayValue}
                className={`usa-input ${messages.length ? "usa-input--error" : ""} `}
                groupSeparator=","
                decimalSeparator="."
                decimalsLimit={2}
                placeholder={placeholder}
                onValueChange={(rawValue, _name, values) => {
                    skipNextSyncRef.current = true;
                    setDisplayValue(rawValue ?? "");
                    if (setEnteredAmount) {
                        const f = values?.float;
                        setEnteredAmount(typeof f === "number" ? f : null);
                    }
                    if (onChange) {
                        onChange(name, rawValue ?? "");
                    }
                }}
                {...rest}
            />
        </div>
    );
};

export default CurrencyInput;
