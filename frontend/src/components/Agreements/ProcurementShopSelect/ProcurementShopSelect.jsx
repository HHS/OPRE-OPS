import { useGetProcurementShopsQuery } from "../../../api/opsAPI";
import ErrorPage from "../../../pages/ErrorPage";

/**  @typedef {import("../../../types/AgreementTypes").ProcurementShop} ProcurementShop */
/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {ProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {boolean} [props.isDisabled] - Whether the select is disabled (optional).
 * @returns {React.ReactElement} - The procurement shop select element.
 */
export const ProcurementShopSelect = ({
    selectedProcurementShop,
    onChangeSelectedProcurementShop,
    legendClassname = "",
    defaultString = "-Select Procurement Shop-",
    isDisabled = false
}) => {
    /** @type {{data?: ProcurementShop[] | undefined, error?: Object,  isLoading: boolean}} */
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops
    } = useGetProcurementShopsQuery({});

    if (isLoadingProcurementShops) {
        return <div>Loading...</div>;
    }

    if (errorProcurementShops) {
        return <ErrorPage />;
    }

    const handleChange = (e) => {
        const procurementShopId = e.target.value;

        if (!procurementShops) return;

        const procurementShop = {
            id: procurementShops[procurementShopId - 1].id,
            name: procurementShops[procurementShopId - 1].name,
            abbr: procurementShops[procurementShopId - 1].abbr,
            fee: procurementShops[procurementShopId - 1].fee_percentage
        };
        onChangeSelectedProcurementShop(procurementShop);
    };

    return (
        <>
            <fieldset
                className="usa-fieldset"
                disabled={isDisabled}
            >
                <label
                    className={`usa-label margin-top-0 ${legendClassname}`}
                    htmlFor="procurement-shop-select"
                >
                    Procurement Shop
                </label>

                <div className="display-flex flex-align-center">
                    <select
                        className="usa-select margin-top-1"
                        name="procurement-shop-select"
                        id="procurement-shop-select"
                        onChange={handleChange}
                        value={selectedProcurementShop?.id || 0}
                        required
                    >
                        <option value={0}>{defaultString}</option>
                        {procurementShops?.map((shop) => (
                            <option
                                key={shop?.id}
                                value={shop?.id}
                            >
                                {shop?.name} ({shop?.abbr})
                            </option>
                        ))}
                    </select>
                </div>
            </fieldset>
        </>
    );
};

export default ProcurementShopSelect;
