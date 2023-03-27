import { useDispatch, useSelector } from "react-redux";
import { setSelectedProcurementShop } from "./createBudgetLineSlice";
import { PROCUREMENT_SHOPS } from "./data";

export const ProcurementShopSelect = () => {
    const dispatch = useDispatch();
    const procurementShops = useSelector(() => PROCUREMENT_SHOPS);
    const selectedProcurementShop = useSelector((state) => state.createBudgetLine.selected_procurement_shop);

    const onChangeProcurementShopSelection = (procurementShopId = "0") => {
        console.log("procurementShopId: " + procurementShopId);
        if (procurementShopId === "0" || procurementShopId === 0) {
            dispatch(setSelectedProcurementShop({}));
        }

        dispatch(
            setSelectedProcurementShop({
                id: procurementShops[procurementShopId - 1].id,
                value: procurementShops[procurementShopId - 1].name,
                fee: procurementShops[procurementShopId - 1].fee,
            })
        );
    };
    return (
        <>
            <label className="usa-label" htmlFor="options">
                Procurement Shop
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="options"
                    id="options"
                    onChange={(e) => onChangeProcurementShopSelection(e.target.value || 0)}
                >
                    <option value="0">- Select -</option>
                    {procurementShops.map((shop) => (
                        <option key={shop?.id} value={shop?.id}>
                            {shop?.name}
                        </option>
                    ))}
                </select>
                {selectedProcurementShop?.id && (
                    <span className="margin-left-1 text-base-dark font-12px">
                        Fee Rate: {selectedProcurementShop?.fee}%
                    </span>
                )}
            </div>
        </>
    );
};
