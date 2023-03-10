export const DesiredAwardDate = () => {
    return (
        <div className="usa-form-group">
            <fieldset className="usa-fieldset">
                <legend className="usa-legend">Desired Award Date</legend>
                <div className="display-flex">
                    <div className="usa-form-group usa-form-group--month margin-top-0">
                        <label className="usa-label sr-only" htmlFor="procurement_month">
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
                            placeholder="MM"
                            // value=""
                        />
                    </div>
                    <div className="usa-form-group usa-form-group--day margin-top-0">
                        <label className="usa-label sr-only" htmlFor="procurement_day">
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
                            placeholder="DD"
                            // value=""
                        />
                    </div>
                    <div className="usa-form-group usa-form-group--year margin-top-0">
                        <label className="usa-label sr-only" htmlFor="procurement_year">
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
                            placeholder="YYYY"
                            // value=""
                        />
                    </div>
                </div>
            </fieldset>
        </div>
    );
};
