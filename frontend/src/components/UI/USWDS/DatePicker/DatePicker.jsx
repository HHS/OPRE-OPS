import React, { useLayoutEffect, useRef } from "react";
import datePicker from "@uswds/uswds/js/usa-date-picker";

function DatePicker({ id, name, label = "Appointment date", hint = "mm/dd/yyyy", onChange, minDate, value }) {
    const datePickerRef = useRef(null);
    useLayoutEffect(() => {
        const datePickerElement = datePickerRef.current;
        datePicker.on(datePickerElement);
        const externalInput = datePicker.getDatePickerContext(datePickerElement).externalInputEl;
        if (onChange) {
            externalInput.addEventListener("change", onChange);
        }
        // Set the value of the input field directly
        if (value) {
            externalInput.value = value;
        }
        return () => {
            if (onChange) {
                externalInput.removeEventListener("change", onChange);
            }
            datePicker.off(datePickerElement);
        };
    }, [onChange, id, value]); // Added value to the dependency array
    return (
        <div className="usa-form-group">
            <label
                id={id}
                className="usa-label"
                htmlFor="uswds-date"
            >
                {label}
            </label>
            <div
                className="usa-hint"
                id="uswds-date-hint"
            >
                {hint}
            </div>
            <div
                ref={datePickerRef}
                className="usa-date-picker"
            >
                <input
                    className="usa-input"
                    id={id}
                    name={name}
                    aria-labelledby="uswds-date-label"
                    aria-describedby="uswds-date-hint"
                    onChange={onChange}
                    value={value}
                />
            </div>
        </div>
    );
}

export default DatePicker;

function getDateString(minDate) {
    if (typeof minDate === "string") {
        const date = new Date(minDate);
        return date.toISOString().substring(0, 10);
    } else {
        return minDate.toISOString().substring(0, 10);
    }
}
