import ComboBox from "../ComboBox";

/**
 *  A comboBox for choosing a project.
 * @param {Object} props - The component props.
 * @param {number[]} props.selectedFiscalYears - The currently selected fiscal years.
 * @param {Function} props.setSelectedFiscalYears - A function to call when the selected fiscal year changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {number[]} props.budgetLinesFiscalYears - An array of fiscal years to display
 * @returns {React.ReactElement} - The rendered component.
 */
export const FiscalYearComboBox = ({
    selectedFiscalYears,
    setSelectedFiscalYears,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    budgetLinesFiscalYears = []
}) => {
    const fiscalYears = budgetLinesFiscalYears
        .filter((fiscalYear) => fiscalYear != null)
        .map((fiscalYear) => {
            if (typeof fiscalYear === "object") {
                return fiscalYear;
            }
            return { id: fiscalYear, title: fiscalYear };
        });

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-combobox-input"
                >
                    Fiscal Year
                </label>
                <div>
                    <ComboBox
                        namespace="fiscal-year-combobox"
                        data={fiscalYears}
                        selectedData={selectedFiscalYears}
                        setSelectedData={setSelectedFiscalYears}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default FiscalYearComboBox;
