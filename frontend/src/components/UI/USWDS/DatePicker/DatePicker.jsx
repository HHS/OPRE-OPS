import React from "react";
import PropTypes from "prop-types";
import cx from "clsx";
import datePicker from "@uswds/uswds/js/usa-date-picker";
import IsRequiredHelper from "../../Form/IsRequiredHelper";
/**
 * DatePicker component based on Comet's USWDS DatePicker.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.id - The ID for the date picker.
 * @param {string} props.name - The name for the date picker.
 * @param {string} props.label - The label for the date picker.
 * @param {string} [props.hint] - The hint for the date picker.
 * @param {string} [props.className] - Additional CSS classes to apply to the component.
 * @param {Function} [props.onChange] - The function to call when the date changes.
 * @param {Date|string} [props.minDate] - The minimum date that can be selected.
 * @param {Date|string} [props.maxDate] - The maximum date that can be selected.
 * @param {string} [props.value] - The current value of the date picker. optional
 * @param {boolean} [props.pending] - A flag to indicate if the date picker is pending. optional
 * @param {Array<string>} [props.messages] - An array of error messages to display. optional
 * @param {boolean} [props.isRequired] - A flag to indicate if the date picker is required.
 * @param {boolean} [props.isRequiredNoShow] - A flag to indicate if the date picker is required but should not show.
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
    const datePickerRef = React.useRef(null);
    const datePickerId = `uswds-date-${id}`;
    const labelId = `uswds-date-label-${id}`;
    const hintId = `uswds-date-hint-${id}`;

    React.useEffect(() => {
        const datePickerElement = datePickerRef.current;
        datePicker.on(datePickerElement);
        const externalInput = datePicker.getDatePickerContext(datePickerElement).externalInputEl;
        if (onChange) {
            externalInput.addEventListener("change", onChange);
        }
        return () => {
            if (onChange) {
                externalInput.removeEventListener("change", onChange);
            }
            datePicker.off(datePickerElement);
        };
    }, []);

    React.useEffect(() => {
        const datePickerElement = datePickerRef.current;
        const externalInput = datePicker.getDatePickerContext(datePickerElement).externalInputEl;
        if (value !== null) {
            externalInput.value = value;
        } else {
            // Clear the input field if the value prop is null
            externalInput.value = "";
        }
    }, [value]); // Added a separate useEffect hook for handling value changes

    // NOTE: Have not tested this with minDate and maxDate
    const datePickerAttributes = {};
    if (minDate) datePickerAttributes["data-min-date"] = getDateString(minDate);
    if (maxDate) datePickerAttributes["data-max-date"] = getDateString(maxDate);

    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label
                id={labelId}
                className={`usa-label ${messages.length ? "usa-label--error" : ""} `}
                htmlFor={datePickerId}
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
                <>
                    <IsRequiredHelper
                        isRequired={isRequired}
                        isRequiredNoShow={isRequiredNoShow}
                    />
                    {hint && (
                        <div
                            className="usa-hint"
                            id={hintId}
                        >
                            {hint}
                        </div>
                    )}
                </>
            )}
            <div
                ref={datePickerRef}
                className="usa-date-picker"
                {...datePickerAttributes}
            >
                <input
                    className="usa-input"
                    id={datePickerId}
                    name={name}
                    aria-labelledby={labelId}
                    aria-describedby={hintId}
                    value={value}
                    onChange={onChange}
                />
            </div>
        </div>
    );

    function getDateString(minDate) {
        if (typeof minDate === "string") {
            const date = new Date(minDate);
            return date.toISOString().substring(0, 10);
        } else {
            return minDate.toISOString().substring(0, 10);
        }
    }
}

DatePicker.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    value: PropTypes.string
};

export default DatePicker;
