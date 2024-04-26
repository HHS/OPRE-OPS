import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import cx from "clsx";
import datePicker from "@uswds/uswds/js/usa-date-picker";
import IsRequiredHelper from "../../Form/IsRequiredHelper";

function DatePicker({
    id,
    name,
    label,
    hint,
    className,
    onChange,
    minDate,
    maxDate,
    value,
    pending = false,
    messages = [],
    isRequired = false,
    isRequiredNoShow = false
}) {
    const datePickerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const datePickerElement = datePickerRef.current;
        datePicker.on(datePickerElement);
        inputRef.current = datePicker.getDatePickerContext(datePickerElement).externalInputEl;
        inputRef.current.value = value || ""; // Set initial value for uncontrolled input

        const handleInputChange = (event) => {
            onChange({
                target: {
                    name: name,
                    value: event.target.value
                }
            });
        };

        // Add event listener
        inputRef.current.addEventListener("change", handleInputChange);

        return () => {
            // Ensure the input exists before attempting to remove the event listener
            if (inputRef.current) {
                inputRef.current.removeEventListener("change", handleInputChange);
            }
            datePicker.off(datePickerElement);
        };
    }, [onChange, value]); // Adding dependencies might ensure proper initialization and cleanup

    const datePickerAttributes = {
        ...(minDate && { "data-min-date": getDateString(minDate) }),
        ...(maxDate && { "data-max-date": getDateString(maxDate) })
    };

    return (
        <div className={cx("usa-form-group", { pending }, className)}>
            <label
                htmlFor={id}
                className={cx("usa-label", { "usa-label--error": messages.length })}
                id={`${id}-label`}
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
            <IsRequiredHelper
                isRequired={isRequired}
                isRequiredNoShow={isRequiredNoShow}
            />
            {hint && (
                <div
                    className="usa-hint"
                    id={`${id}-hint`}
                >
                    {hint}
                </div>
            )}
            <div
                ref={datePickerRef}
                className="usa-date-picker"
                {...datePickerAttributes}
            >
                <input
                    ref={inputRef}
                    className="usa-input"
                    id={id}
                    name={name}
                    aria-labelledby={`${id}-label`}
                    aria-describedby={hint ? `${id}-hint` : undefined}
                    // Removed value and onChange to handle as uncontrolled
                />
            </div>
        </div>
    );
}

function getDateString(date) {
    return date instanceof Date ? date.toISOString().substring(0, 10) : date;
}

DatePicker.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    value: PropTypes.string,
    pending: PropTypes.bool,
    messages: PropTypes.arrayOf(PropTypes.string),
    isRequired: PropTypes.bool,
    isRequiredNoShow: PropTypes.bool
};

export default React.memo(DatePicker);
