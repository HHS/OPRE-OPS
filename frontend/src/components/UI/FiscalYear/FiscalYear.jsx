import constants from "../../../constants";

/**
 * FiscalYear component for selecting a fiscal year
 * @param {Object} props - Component props
 * @param {number} props.fiscalYear - Current fiscal year selected
 * @param {(e: string) => void} props.handleChangeFiscalYear - Function to handle fiscal year change
 * @returns {JSX.Element} FiscalYear component
 */
const FiscalYear = ({ fiscalYear, handleChangeFiscalYear }) => {
    return (
        <div
            className="display-flex flex-justify flex-align-center"
            style={{ width: "10.625rem" }}
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
                style={{ width: "5.125rem" }}
                onChange={(e) => handleChangeFiscalYear(e.target.value)}
                value={fiscalYear}
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
