export const DateOfProcurement = () => {
    return (
        <div className="usa-form-group">
            <fieldset className="usa-fieldset">
                <legend className="usa-legend">Date of Procurement</legend>
                <div className="usa-memorable-date">
                    <div className="usa-form-group usa-form-group--month usa-form-group--select">
                        <label className="usa-label" htmlFor="procurement_month">
                            Month
                        </label>
                        <input
                            className="usa-input"
                            aria-describedby="mdHint"
                            id="procurement_month"
                            name="procurement_month"
                            maxLength="2"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            // value=""
                        />
                    </div>
                    <div className="usa-form-group usa-form-group--day">
                        <label className="usa-label" htmlFor="procurement_day">
                            Day
                        </label>
                        <input
                            className="usa-input"
                            aria-describedby="mdHint"
                            id="procurement_day"
                            name="procurement_day"
                            maxLength="2"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            // value=""
                        />
                    </div>
                    <div className="usa-form-group usa-form-group--year">
                        <label className="usa-label" htmlFor="procurement_year">
                            Year
                        </label>
                        <input
                            className="usa-input"
                            aria-describedby="mdHint"
                            id="procurement_year"
                            name="procurement_year"
                            minLength="4"
                            maxLength="4"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            // value=""
                        />
                    </div>
                </div>
            </fieldset>
        </div>
    );
};
