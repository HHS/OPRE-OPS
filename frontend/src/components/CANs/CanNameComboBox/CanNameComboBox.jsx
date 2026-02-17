import ComboBox from "../../UI/Form/ComboBox";

/**
 * @typedef {Object} DataProps
 * @property {number} id - The identifier of the data item
 * @property {string} title - The title of the data item
 */

/**
 * @component
 * @param {Object} props - The component props.
 * @param {DataProps[]} props.canOptions - All the CAN options.
 * @param {DataProps[]} props.can - The current CAN selection.
 * @param {Function} props.setCan - A function to call to set the CAN selection.
 * @param {string} [props.legendClassname] - The class name for the legend (optional).
 * @param {string} [props.defaultString] - The default string to display (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered CAN Name ComboBox component.
 */
const CanNameComboBox = ({
    canOptions,
    can,
    setCan,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="can-name-combobox-input"
                >
                    CAN
                </label>
                <div>
                    <ComboBox
                        namespace="can-name-combobox"
                        data={canOptions}
                        selectedData={can}
                        setSelectedData={setCan}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CanNameComboBox;
