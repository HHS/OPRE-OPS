import MonthSelect from "./MonthSelect";
import DayInput from "./DayInput";
import YearInput from "./YearInput";

/**
 * Renders a form for entering a desired award date.
 * @param {Object} props - The component props.
 * @param {number} props.enteredMonth - The currently entered month.
 * @param {function} props.setEnteredMonth - A function to update the entered month.
 * @param {string} props.enteredDay - The currently entered day.
 * @param {function} props.setEnteredDay - A function to update the entered day.
 * @param {string} props.enteredYear - The currently entered year.
 * @param {function} props.setEnteredYear - A function to update the entered year.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {function} props.runValidate - A function to run Vest validation.
 * @param {Object} props.res - The Vest validation result object.
 * @param {function} props.cn - The className to apply to the component.
 * @returns {JSX.Element} - The rendered component.
 */
export const DesiredAwardDate = ({
    enteredMonth,
    setEnteredMonth,
    enteredDay,
    setEnteredDay,
    enteredYear,
    setEnteredYear,
    isReviewMode,
    runValidate,
    res,
    cn,
}) => {
    return (
        <div className="usa-form-group">
            <fieldset className="usa-fieldset">
                <legend className="usa-legend">Need By Date</legend>
                <div className="display-flex">
                    <MonthSelect
                        name="enteredMonth"
                        label="Month"
                        messages={res.getErrors("enteredMonth")}
                        className={cn("enteredMonth")}
                        value={enteredMonth || 0}
                        onChange={(name, value) => {
                            setEnteredMonth(value);
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
                    />
                    <DayInput
                        name="enteredDay"
                        label="Day"
                        messages={res.getErrors("enteredDay")}
                        className={cn("enteredDay")}
                        value={enteredDay || ""}
                        onChange={(name, value) => {
                            setEnteredDay(value);
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
                    />
                    <YearInput
                        name="enteredYear"
                        label="Year"
                        messages={res.getErrors("enteredYear")}
                        className={cn("enteredYear")}
                        value={enteredYear || ""}
                        onChange={(name, value) => {
                            setEnteredYear(value);
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
                    />
                </div>
            </fieldset>
        </div>
    );
};

export default DesiredAwardDate;
