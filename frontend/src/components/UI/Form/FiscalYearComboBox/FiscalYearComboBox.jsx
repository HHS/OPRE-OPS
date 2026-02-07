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
                const isAll = fiscalYear.id === "ALL";
                const rawId = fiscalYear.id;
                const isNumericString = typeof rawId === "string" && /^\d+$/.test(rawId);
                const parsedId = !isAll && isNumericString ? Number(rawId) : rawId;
                const shouldPrefixFY = !isAll && typeof parsedId === "number";
                let title = fiscalYear.title;
                if (shouldPrefixFY) {
                    const titleValue = String(fiscalYear.title);
                    title = titleValue.startsWith("FY ") ? fiscalYear.title : `FY ${parsedId}`;
                }
                return { ...fiscalYear, id: parsedId, title };
            }
            const parsedId =
                typeof fiscalYear === "string" && /^\d+$/.test(fiscalYear) ? Number(fiscalYear) : fiscalYear;
            return { id: parsedId, title: `FY ${parsedId}` };
        })
        .filter((fiscalYear, index, list) => list.findIndex((item) => item.id === fiscalYear.id) === index);

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-combobox-input"
                >
                    Compare Fiscal Years
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
