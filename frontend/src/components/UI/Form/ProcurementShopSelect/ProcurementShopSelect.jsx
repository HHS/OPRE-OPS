import { useGetProcurementShopsQuery } from "../../../../api/opsAPI";

export const ProcurementShopSelect = ({ selectedProcurementShop, onChangeSelectedProcurementShop }) => {
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops,
    } = useGetProcurementShopsQuery();

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
                    <option value={0}>- Select a Procurement Shop -</option>
                    {procurementShops.map((shop) => (
                        <option key={shop?.id} value={shop?.id}>
                            {shop?.name} ({shop?.abbr})
                        </option>
                    ))}
                </select>
                {selectedProcurementShop?.id && (
                    <span className="margin-left-1 text-base-dark font-12px">
                        Fee Rate: {selectedProcurementShop?.fee * 100}%
                    </span>
                )}
            </div>
        </fieldset>
    );
};

export default ProcurementShopSelect;
