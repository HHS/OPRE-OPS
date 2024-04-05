function DatePicker({ label = "Appointment date", hint = "mm/dd/yyyy" }) {
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
            <div className="usa-date-picker">
                <input
                    className="usa-input"
                    id="uswds-date"
                    name="uswds-date"
                    aria-labelledby="uswds-date-label"
                    aria-describedby="uswds-date-hint"
                />
            </div>
        </div>
    );
}

export default DatePicker;
