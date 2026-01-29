import ComboBox from "../../../../components/UI/Form/ComboBox";

/**
 * @typedef {Object} AvailableBudgetPercentageFilterProps
 * @property {string[]} selectedRanges - Array of selected range codes
 * @property {function(string[]): void} setSelectedRanges - Function to update selected ranges
 * @property {string} [legendClassname] - CSS class for the legend
 */

/**
 * Available budget percentage filter options
 * Ordered from highest to lowest percentage
 */
const PERCENTAGE_RANGES = [
    { code: "over90", label: "Over 90% available", order: 1 },
    { code: "75-90", label: "75% - 90% available", order: 2 },
    { code: "50-75", label: "50% - 75% available", order: 3 },
    { code: "25-50", label: "25% - 50% available", order: 4 },
    { code: "under25", label: "Less than 25% available", order: 5 }
];

/**
 * @description AvailableBudgetPercentageFilter component
 * @component
 * @param {AvailableBudgetPercentageFilterProps} props
 * @returns {JSX.Element} - The Available Budget Percentage Filter component
 */
const AvailableBudgetPercentageFilter = ({
    selectedRanges,
    setSelectedRanges,
    legendClassname = "usa-label margin-top-0"
}) => {
    // Transform PERCENTAGE_RANGES to ComboBox format
    const rangeOptions = PERCENTAGE_RANGES.map((range) => ({
        id: range.code,
        title: range.label,
        name: range.label,
        order: range.order // Include order for sorting
    }));

    // Transform selectedRanges (array of codes) to ComboBox format (array of objects)
    const selectedRangeObjects = selectedRanges
        .map((code) => PERCENTAGE_RANGES.find((range) => range.code === code))
        .filter(Boolean)
        .map((range) => ({
            id: range.code,
            title: range.label,
            name: range.label,
            order: range.order // Include order for sorting
        }));

    // Handle ComboBox change - receives array of objects, convert to array of codes
    const handleRangeChange = (selectedOptions) => {
        const codes = selectedOptions ? selectedOptions.map((option) => option.id) : [];
        setSelectedRanges(codes);
    };

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="available-budget-percentage-combobox-input"
                >
                    Available Budget
                </label>
                <div>
                    <ComboBox
                        namespace="available-budget-percentage-combobox"
                        data={rangeOptions}
                        selectedData={selectedRangeObjects}
                        setSelectedData={handleRangeChange}
                        overrideStyles={{ width: "22.7rem" }}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default AvailableBudgetPercentageFilter;
