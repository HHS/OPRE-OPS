function DatePicker({ label = "Appointment date", hint = "mm/dd/yyyy" }) {
    return (
        <div className="usa-form-group">
            <label
                className="usa-label"
                id="appointment-date-label"
                htmlFor="appointment-date"
            >
                {label}
            </label>
            <div
                className="usa-hint"
                id="appointment-date-hint"
            >
                {hint}
            </div>
            <div className="usa-date-picker">
                <input
                    className="usa-input"
                    id="appointment-date"
                    name="appointment-date"
                    aria-labelledby="appointment-date-label"
                    aria-describedby="appointment-date-hint"
                />
            </div>
        </div>
    );
}

export default DatePicker;
