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
 * @param {string} [props.defaultString] - The default string to display (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered component.
 */
const CANActivePeriodComboBox = ({
    activePeriod,
    setActivePeriod,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = { width: "187px" }
}) => {
    const periods = [
        { id: 1, title: "1 Year" },
        { id: 2, title: "2 Year" },
        { id: 3, title: "3 Year" },
        { id: 4, title: "4 Year" },
        { id: 5, title: "5 Year" }
    ];

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="can-active-period-combobox-input"
                >
                    Active Period
                </label>
                <div>
                    <ComboBox
                        namespace="can-active-period-combobox"
                        data={periods}
                        selectedData={activePeriod}
                        setSelectedData={setActivePeriod}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CANActivePeriodComboBox;
