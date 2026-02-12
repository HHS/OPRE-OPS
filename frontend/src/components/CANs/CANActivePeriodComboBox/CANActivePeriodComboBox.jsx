import ComboBox from "../../UI/Form/ComboBox";
/**
 * @typedef {Object} DataProps
 * @property {number} id - The identifier of the data item
 * @property {string} title - The title of the data item
 */

/**
 * @component
 * @param {Object} props - The component props.
 * @param {DataProps[]} props.activePeriod - The current active period.
 * @param {Function} props.setActivePeriod - A function to call to set the active period.
 * @param {string} [props.legendClassname] - The class name for the legend (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @param {number[]} [props.canActivePeriodOptions] - Optional pre-fetched active period options from API (optional).
 * @param {string} [props.filterLabel] - Label for the filter (optional, defaults to "Active Period").
 * @returns {React.ReactElement} - The rendered component.
 */
const CANActivePeriodComboBox = ({
    activePeriod,
    setActivePeriod,
    legendClassname = "usa-label margin-top-0",
    overrideStyles = {},
    canActivePeriodOptions = null,
    filterLabel = "Active Period"
}) => {
    // Default periods if no options provided
    const defaultPeriods = [
        { id: 1, title: "1 Year" },
        { id: 2, title: "2 Year" },
        { id: 3, title: "3 Year" },
        { id: 4, title: "4 Year" },
        { id: 5, title: "5 Year" }
    ];

    // Use provided options or default periods
    const periods = canActivePeriodOptions
        ? canActivePeriodOptions.map((period) => ({
              id: period,
              title: `${period} Year`
          }))
        : defaultPeriods;

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="can-active-period-combobox-input"
                >
                    {filterLabel}
                </label>
                <div>
                    <ComboBox
                        namespace="can-active-period-combobox"
                        data={periods}
                        selectedData={activePeriod}
                        setSelectedData={setActivePeriod}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CANActivePeriodComboBox;
