import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import cx from "clsx";
import datePicker from "@uswds/uswds/js/usa-date-picker";
import IsRequiredHelper from "../../Form/IsRequiredHelper";

/**
 * DatePicker component for selecting dates.
 * Utilizes the USWDS (U.S. Web Design System) date picker component.
 *
 * @component
 * @param {Object} props - The props for the DatePicker component.
 * @param {string} props.id - The id for the date picker input element.
 * @param {string} props.name - The name attribute for the date picker input element.
 * @param {string} props.label - The label for the date picker.
 * @param {string} [props.hint] - Optional hint text for the date picker.
 * @param {string} [props.className] - Additional class names for the date picker container.
 * @param {Function} props.onChange - Callback function that is called when the date is changed.
 * @param {Date|string} [props.minDate] - The minimum date that can be selected.
 * @param {Date|string} [props.maxDate] - The maximum date that can be selected.
 * @param {string} [props.value] - The current value of the date picker.
 * @param {boolean} [props.pending=false] - If true, indicates that the date picker is in a pending state.
 * @param {Array<string>} [props.messages=[]] - Error messages to display.
 * @param {boolean} [props.isRequired=false] - If true, indicates that the date picker is required.
 * @param {boolean} [props.isRequiredNoShow=false] - If true, indicates that the date picker is required but does not visually show it.
 * @returns {JSX.Element} The rendered DatePicker component.
 */

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
