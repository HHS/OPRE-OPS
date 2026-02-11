import { useMemo } from "react";
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
 * @param {string} [props.label] - Custom label text (optional, defaults to "Fiscal Year").
 * @param {boolean} [props.includeAllOption] - Whether to include "All FYs" as an option (optional, defaults to false).
 * @returns {React.ReactElement} - The rendered component.
 */
export const FiscalYearComboBox = ({
    selectedFiscalYears,
    setSelectedFiscalYears,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    budgetLinesFiscalYears = [],
    label = "Fiscal Year",
    includeAllOption = false
}) => {
    const fiscalYears = useMemo(() => {
        const years = budgetLinesFiscalYears.map((fiscalYear) => {
            return { id: fiscalYear, title: fiscalYear };
        });

        if (includeAllOption) {
            return [{ id: "all", title: "All FYs" }, ...years];
        }

        return years;
    }, [budgetLinesFiscalYears, includeAllOption]);

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-combobox-input"
                >
                    {label}
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
