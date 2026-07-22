import ComboBox from "../ComboBox";

/**
 * @typedef {Object} ProcurementShop
 * @property {number} id - The identifier of the procurement shop.
 * @property {string} abbr - The abbreviation of the procurement shop.
 */

/**
 * A multi-select ComboBox for filtering by procurement shop.
 * @component
 * @param {Object} props - The component props.
 * @param {ProcurementShop[]} props.procShopOptions - All the procurement shop options.
 * @param {ProcurementShop[]} props.procShop - The currently selected procurement shops.
 * @param {Function} props.setProcShop - A function to call to set the selected procurement shops.
 * @param {string} [props.legendClassname] - The class name for the label (optional).
 * @param {string} [props.defaultString] - The default string to display (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered Procurement Shop ComboBox component.
 */
const ProcShopComboBox = ({
    procShopOptions,
    procShop,
    setProcShop,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="proc-shop-combobox-input"
                >
                    Procurement Shop
                </label>
                <div>
                    <ComboBox
                        namespace="proc-shop-combobox"
                        data={procShopOptions}
                        selectedData={procShop}
                        setSelectedData={setProcShop}
                        optionText={(shop) => shop.abbr}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProcShopComboBox;
