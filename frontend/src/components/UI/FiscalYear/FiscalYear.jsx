import constants from "../../../constants";

/**
 * FiscalYear component for selecting a fiscal year
 * @param {Object} props - Component props
 * @param {number | string} props.fiscalYear - Current fiscal year selected
 * @param {(e: string) => void} props.handleChangeFiscalYear - Function to handle fiscal year change
 * @param {number[]} [props.fiscalYears] - Optional array of fiscal year options (defaults to constants.fiscalYears)
 * @param {boolean} [props.showAllOption] - Optional flag to show "All" option at the bottom (defaults to false)
 * @returns {React.ReactElement} FiscalYear component
 */
const FiscalYear = ({ fiscalYear, handleChangeFiscalYear, fiscalYears, showAllOption = false }) => {
    const years = fiscalYears && fiscalYears.length > 0 ? fiscalYears : constants.fiscalYears;

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
                {fiscalYear === "Multi" && <option value="Multi">Multi</option>}
                {years.map((year) => {
                    return (
                        <option
                            key={year}
                            value={year}
                        >
                            {year}
                        </option>
                    );
                })}
                {showAllOption && <option value="All">All</option>}
            </select>
        </div>
    );
};

export default FiscalYear;
