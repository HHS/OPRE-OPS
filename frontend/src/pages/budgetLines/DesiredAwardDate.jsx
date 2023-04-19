import { useDispatch, useSelector } from "react-redux";
import { setEnteredMonth, setEnteredDay, setEnteredYear } from "./createBudgetLineSlice";

export const DesiredAwardDate = () => {
    const dispatch = useDispatch();
    const enteredMonth = useSelector((state) => state.createBudgetLine.entered_month);
    const enteredDay = useSelector((state) => state.createBudgetLine.entered_day);
    const enteredYear = useSelector((state) => state.createBudgetLine.entered_year);

    return (
        <div className="usa-form-group">
            <fieldset className="usa-fieldset" required>
                <legend className="usa-legend">Need By Date</legend>
                <div className="display-flex">
                    <div className="usa-form-group usa-form-group--month margin-top-0">
                        <label className="usa-label sr-only" htmlFor="procurement_month">
                            Month
                        </label>
                        <select
                            className="usa-select"
                            id="procurement_month"
                            name="procurement_month"
                            aria-describedby="mdHint"
                            style={{ width: "6.9375rem" }}
                            value={enteredMonth || 0}
                            onChange={(e) => dispatch(setEnteredMonth(e.target.value))}
                        >
                            <option value>Month</option>
                            <option value="1">01 - Jan</option>
                            <option value="2">02 - Feb</option>
                            <option value="3">03 - Mar</option>
                            <option value="4">04 - Apr</option>
                            <option value="5">05 - May</option>
                            <option value="6">06 - Jun</option>
                            <option value="7">07 - Jul</option>
                            <option value="8">08 - Aug</option>
                            <option value="9">09 - Sep</option>
                            <option value="10">10 - Oct</option>
                            <option value="11">11 - Nov</option>
                            <option value="12">12 - Dec</option>
                        </select>
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
                            value={enteredDay || ""}
                            onChange={(e) => dispatch(setEnteredDay(e.target.value))}
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
                            value={enteredYear || ""}
                            onChange={(e) => dispatch(setEnteredYear(e.target.value))}
                        />
                    </div>
                </div>
            </fieldset>
        </div>
    );
};
