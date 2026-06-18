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
 * @param {boolean} [props.isRequiredNoShow] - Flag for required field without showing asterisk (optional, not passed to DOM)
 * @param {string} [props.dataCy] - Cypress data-cy attribute (optional)
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
    isRequiredNoShow, // eslint-disable-line no-unused-vars -- Extracted to prevent passing to DOM
    dataCy,
    ...rest
}) => {
    // displayValue holds the raw typed string (e.g. "5.") so a trailing
    // decimal isn't stripped before the user finishes typing the cents.
    const [displayValue, setDisplayValue] = useState(value ?? "");
    // The parent typically echoes our raw string back as a parsed number
    // (e.g. raw "5." -> float 5 -> rendered "5"). Track both forms of the
    // last-emitted value so the echo is identifiable and can be ignored,
    // while genuine parent-driven changes (e.g. reset to "") still apply.
    const lastEmittedRef = useRef({ raw: String(value ?? ""), float: typeof value === "number" ? value : NaN });

    useEffect(() => {
        const incomingStr = String(value ?? "");
        const incomingNum = typeof value === "number" ? value : Number(value);
        const { raw, float } = lastEmittedRef.current;
        const isEcho = incomingStr === raw || (Number.isFinite(incomingNum) && incomingNum === float);
        if (isEcho) return;
        lastEmittedRef.current = { raw: incomingStr, float: Number.isFinite(incomingNum) ? incomingNum : NaN };
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
                data-cy={dataCy}
                onValueChange={(rawValue, _name, values) => {
                    const f = values?.float;
                    const floatValue = typeof f === "number" ? f : NaN;
                    lastEmittedRef.current = { raw: rawValue ?? "", float: floatValue };
                    setDisplayValue(rawValue ?? "");
                    if (setEnteredAmount) {
                        setEnteredAmount(Number.isFinite(floatValue) ? floatValue : null);
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
