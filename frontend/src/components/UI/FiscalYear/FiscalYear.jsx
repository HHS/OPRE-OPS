import constants from "../../../constants";

/**
 * FiscalYear component for selecting a fiscal year
 * @param {Object} props - Component props
 * @param {number | string} props.fiscalYear - Current fiscal year selected
 * @param {(e: string) => void} props.handleChangeFiscalYear - Function to handle fiscal year change
 * @returns {React.ReactElement} FiscalYear component
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
                {fiscalYear === "All" && <option value="All">All</option>}
                {fiscalYear === "Multi" && <option value="Multi">Multi</option>}
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
