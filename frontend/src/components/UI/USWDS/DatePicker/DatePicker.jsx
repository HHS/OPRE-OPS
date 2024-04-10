import React from "react";
import PropTypes from "prop-types";
import datePicker from "@uswds/uswds/js/usa-date-picker";

/**
 * DatePicker component based on Comet's USWDS DatePicker.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.id - The ID for the date picker.
 * @param {string} props.name - The name for the date picker.
 * @param {string} props.label - The label for the date picker.
 * @param {string} [props.hint] - The hint for the date picker.
 * @param {function} [props.onChange] - The function to call when the date changes.
 * @param {Date|string} [props.minDate] - The minimum date that can be selected.
 * @param {Date|string} [props.maxDate] - The maximum date that can be selected.
 * @param {string} [props.value] - The current value of the date picker.
 * @returns {JSX.Element} The rendered DatePicker component.
 */

function DatePicker({ id, name, label, hint, onChange, minDate, maxDate, value }) {
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

    const datePickerAttributes = {};
    if (minDate) datePickerAttributes["data-min-date"] = getDateString(minDate);
    if (maxDate) datePickerAttributes["data-max-date"] = getDateString(maxDate);

    return (
        <div className="usa-form-group">
            <label
                id={labelId}
                className="usa-label"
                htmlFor={datePickerId}
            >
                {label}
            </label>
            {hint && (
                <div
                    className="usa-hint"
                    id={hintId}
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
}

export default DatePicker;

DatePicker.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    onChange: PropTypes.func,
    minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    value: PropTypes.string
};

function getDateString(minDate) {
    if (typeof minDate === "string") {
        const date = new Date(minDate);
        return date.toISOString().substring(0, 10);
    } else {
        return minDate.toISOString().substring(0, 10);
    }
}
