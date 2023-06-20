import React from "react";
import { useGetProcurementShopsQuery } from "../../../../api/opsAPI";

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
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const ProcurementShopSelect = ({ selectedProcurementShop, onChangeSelectedProcurementShop }) => {
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops,
    } = useGetProcurementShopsQuery();

    React.useEffect(() => {
        if (!selectedProcurementShop?.id && procurementShops) {
            onChangeSelectedProcurementShop(procurementShops[1]);
        }
    }, [procurementShops, selectedProcurementShop, onChangeSelectedProcurementShop]);

    if (isLoadingProcurementShops) {
        return <div>Loading...</div>;
    }
    if (errorProcurementShops) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        const procurementShopId = e.target.value;

        const procurementShop = {
            id: procurementShops[procurementShopId - 1].id,
            name: procurementShops[procurementShopId - 1].name,
            fee: procurementShops[procurementShopId - 1].fee,
        };
        onChangeSelectedProcurementShop(procurementShop);
    };

    /**
     * Displays the fee rate for a selected procurement shop.
     * @param {Object} props - The component props.
     * @param {selectedProcurementShop} props.selectedProcurementShop - The selected procurement shop object.
     * @returns {React.JSX.Element|null} - The fee rate element, or null if no procurement shop is selected.
     */
    const FeeRate = ({ selectedProcurementShop }) => {
        if (selectedProcurementShop?.id) {
            return (
                <span className="margin-left-1 text-base-dark font-12px" data-cy="fee">
                    Fee Rate: {selectedProcurementShop?.fee * 100}%
                </span>
            );
        }
    };
    return (
        <fieldset className="usa-fieldset">
            <label className="usa-label margin-top-0" htmlFor="procurement-shop-select">
                Procurement Shop
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-fit-content"
                    name="procurement-shop-select"
                    id="procurement-shop-select"
                    onChange={handleChange}
                    value={selectedProcurementShop?.id}
                    required
                >
                    {procurementShops.map((shop) => (
                        <option key={shop?.id} value={shop?.id}>
                            {shop?.name} ({shop?.abbr})
                        </option>
                    ))}
                </select>

                <FeeRate selectedProcurementShop={selectedProcurementShop} />
            </div>
        </fieldset>
    );
};

export default ProcurementShopSelect;
