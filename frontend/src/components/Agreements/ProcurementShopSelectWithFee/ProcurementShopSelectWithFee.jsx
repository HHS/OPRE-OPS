import ProcurementShopSelect from "../ProcurementShopSelect";

/**  @typedef {import("../../../types/AgreementTypes").ProcurementShop} ProcurementShop */
/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {ProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @returns {React.ReactElement} - The procurement shop select element with fee display.
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
     * @private
     */
    const FeeRate = ({ selectedProcurementShop }) => {
        if (selectedProcurementShop?.id) {
            return (
                <span
                    className="margin-left-1 text-base-dark font-12px"
                    data-cy="fee"
                >
                    {/* NOTE: fallback to select rather than API response */}
                    Fee Rate: {selectedProcurementShop?.fee_percentage ?? selectedProcurementShop?.fee}%
                </span>
            );
        }
    };
    return (
        <div className="display-flex flex-justify width-mobile-lg flex-align-center">
            <ProcurementShopSelect
                selectedProcurementShop={selectedProcurementShop}
                onChangeSelectedProcurementShop={onChangeSelectedProcurementShop}
                legendClassname={legendClassname}
            />

            <FeeRate selectedProcurementShop={selectedProcurementShop} />
        </div>
    );
};

export default ProcurementShopSelectWithFee;
