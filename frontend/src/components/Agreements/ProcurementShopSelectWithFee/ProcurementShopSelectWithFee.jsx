import { agreement } from "../../../tests/data";
import ProcurementShopSelect from "../ProcurementShopSelect";

/**  @typedef {import("../../../types/AgreementTypes").ProcurementShop} ProcurementShop */
/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {ProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {boolean} [props.isDisabled] - Whether the select is disabled (optional).
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.disabledMessage] - Message to display when the select is disabled (optional).
 * @returns {React.ReactElement} - The procurement shop select element with fee display.
 */
export const ProcurementShopSelectWithFee = ({
    selectedProcurementShop,
    onChangeSelectedProcurementShop,
    isDisabled = false,
    disabledMessage = "Disabled",
    legendClassname = ""
}) => {
    /**
     * @component - Displays the fee rate for a selected procurement shop.
     * @private
     * @param {Object} props - The component props.
     * @param {selectedProcurementShop} props.selectedProcurementShop - The selected procurement shop object.
     * @returns {React.JSX.Element | undefined} - The fee rate element, or null if no procurement shop is selected.
     */
    const FeeRate = ({ selectedProcurementShop }) => {
        if (selectedProcurementShop?.id) {
            return (
                <span
                    className="margin-left-1 text-base-dark font-12px margin-top-4"
                    data-cy="fee"
                >
                    {/* NOTE: fallback to select rather than API response */}
                    Fee Rate: {selectedProcurementShop?.fee ?? agreement.procurement_shop.fee_percentage}%
                </span>
            );
        }
    };
    return (
        <div
            className="display-flex width-mobile-lg flex-align-center"
            style={{ flexDirection: "row", columnGap: "20px" }}
        >
            <ProcurementShopSelect
                selectedProcurementShop={selectedProcurementShop}
                onChangeSelectedProcurementShop={onChangeSelectedProcurementShop}
                legendClassname={legendClassname}
                isDisabled={isDisabled}
                disabledMessage={disabledMessage}
            />
            <FeeRate selectedProcurementShop={selectedProcurementShop} />
        </div>
    );
};

export default ProcurementShopSelectWithFee;
