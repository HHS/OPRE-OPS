import constants from "../../../constants";
import { useDispatch } from "react-redux";

/**
 * FiscalYear component for selecting a fiscal year
 * @param {Object} props - Component props
 * @param {Object} props.fiscalYear - Current fiscal year object
 * @param {Function} props.handleChangeFiscalYear - Function to handle fiscal year change
 * @returns {JSX.Element} FiscalYear component
 */
const FiscalYear = ({ fiscalYear, handleChangeFiscalYear }) => {
    const dispatch = useDispatch();

    /**
     * Handles the change of fiscal year
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event
     */
    const onChangeFiscalYear = (event) => {
        dispatch(handleChangeFiscalYear({ value: event.target.value }));
    };

    return (
        <div
            className="display-flex flex-justify flex-align-center"
            style={{ width: "170px" }}
        >
            <label
                className="font-sans-xs"
                htmlFor="fiscal-year-select"
            >
                Fiscal Year
            </label>
            <select
                id="fiscal-year-select"
                className="usa-select margin-left-1"
                style={{ width: "80px" }}
                onChange={onChangeFiscalYear}
                value={fiscalYear?.value}
            >
                {constants.fiscalYears.map((year) => {
                    return (
                        <option
                            key={year}
                            value={year}
                        >
                            {year}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

export default FiscalYear;
