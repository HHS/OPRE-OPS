import ProcurementShopSelect from "../ProcurementShopSelect";

/**
 * Object representing a procurement shop.
 * @typedef {Object} selectedProcurementShop - The currently selected procurement shop.
 * @property {string} id - The procurement shop id.
 * @property {number} fee - The procurement shop fee rate.
 * @property {string} name - The procurement shop name.
 * @property {string} abbr - The procurement shop abbreviation.
 */

/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {selectedProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const ProcurementShopSelectWithFee = ({
    selectedProcurementShop,
    onChangeSelectedProcurementShop,
    legendClassname = ""
}) => {
    /**
     * Displays the fee rate for a selected procurement shop.
     * @param {Object} props - The component props.
     * @param {selectedProcurementShop} props.selectedProcurementShop - The selected procurement shop object.
     * @returns {React.JSX.Element | undefined} - The fee rate element, or null if no procurement shop is selected.
     */
    const FeeRate = ({ selectedProcurementShop }) => {
        if (selectedProcurementShop?.id) {
            return (
                <span
                    className="margin-left-1 text-base-dark font-12px"
                    data-cy="fee"
                >
                    Fee Rate: {selectedProcurementShop?.fee_percentage}%
                </span>
            );
        }
    };
    return (
        <>
            <ProcurementShopSelect
                selectedProcurementShop={selectedProcurementShop}
                onChangeSelectedProcurementShop={onChangeSelectedProcurementShop}
                legendClassname={legendClassname}
            />

            <FeeRate selectedProcurementShop={selectedProcurementShop} />
        </>
    );
};

export default ProcurementShopSelectWithFee;
