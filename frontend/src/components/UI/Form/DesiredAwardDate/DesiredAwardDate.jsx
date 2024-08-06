import PropTypes from "prop-types";
import MonthSelect from "./MonthSelect";
import DayInput from "./DayInput";
import YearInput from "./YearInput";

/**
 * Renders a form for entering a desired award date.
 * @param {Object} props - The component props.
 * @param {number | string} props.enteredMonth - The currently entered month.
 * @param {function} props.setEnteredMonth - A function to update the entered month.
 * @param {number | string} props.enteredDay - The currently entered day.
 * @param {function} props.setEnteredDay - A function to update the entered day.
 * @param {number | string} props.enteredYear - The currently entered year.
 * @param {function} props.setEnteredYear - A function to update the entered year.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {function} props.runValidate - A function to run Vest validation.
 * @param {Object} props.res - The Vest validation result object.
 * @param {function} props.cn - The className to apply to the component.
 * @returns {React.JSX.Element} - The rendered component.
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
    cn
}) => {
    const dateGroupErrors = Object.values(res.getErrorsByGroup("allDates"));

    const isThereDateGroupErrors = dateGroupErrors.length > 0;
    return (
        <div
            className={`usa-form-group ${isThereDateGroupErrors ? "usa-form-group--error" : ""}`}
            data-cy="date-group-errors"
        >
            <fieldset className="usa-fieldset">
                <legend className={`usa-legend margin-top-0 ${isThereDateGroupErrors ? "text-bold" : ""}`}>
                    Obligate By Date
                </legend>
                {isThereDateGroupErrors &&
                    // instead of mapping over the array of errors, we just want the first one
                    dateGroupErrors[0].map((error, index) => (
                        <span
                            key={index}
                            className="usa-error-message padding-left-2px"
                        >
                            {error}
                            <br />
                        </span>
                    ))}

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

DesiredAwardDate.propTypes = {
    enteredMonth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setEnteredMonth: PropTypes.func.isRequired,
    enteredDay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setEnteredDay: PropTypes.func.isRequired,
    enteredYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setEnteredYear: PropTypes.func.isRequired,
    isReviewMode: PropTypes.bool,
    runValidate: PropTypes.func.isRequired,
    res: PropTypes.object.isRequired,
    cn: PropTypes.func.isRequired
};

export default DesiredAwardDate;
