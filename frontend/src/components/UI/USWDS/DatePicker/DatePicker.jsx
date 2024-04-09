import datePicker from "@uswds/uswds/js/usa-date-picker";
import React, { useLayoutEffect, useRef } from "react";

function DatePicker({ label = "Appointment date", hint = "mm/dd/yyyy", onChange, minDate, value }) {
    useLayoutEffect(() => {
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
    });
    const datePickerRef = useRef(null);
    return (
        <div className="usa-form-group">
            <label
                className="usa-label"
                id="uswds-date-label"
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
                    id="uswds-date"
                    name="uswds-date"
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
