import { useDispatch, useSelector } from "react-redux";
import { setSelectedProcurementShop } from "./createBudgetLineSlice";
//import { PROCUREMENT_SHOPS } from "./data";
import { getProcurementShopList } from "./getProcurementShopList";

export const ProcurementShopSelect = ({ budgetLinesLength = 0 }) => {
    const dispatch = useDispatch();
    const procurementShops = useSelector(async () => await getProcurementShopList());
    const selectedProcurementShop = useSelector((state) => state.createBudgetLine.selected_procurement_shop);

    const onChangeProcurementShopSelection = (procurementShopId = 0) => {
        if (procurementShopId === 0) {
            dispatch(setSelectedProcurementShop({}));
            return;
        }

        dispatch(
            setSelectedProcurementShop({
                id: procurementShops[procurementShopId - 1].id,
                name: procurementShops[procurementShopId - 1].name,
                fee: procurementShops[procurementShopId - 1].fee,
            })
        );
    };
    return (
        <fieldset className="usa-fieldset" disabled={budgetLinesLength !== 0}>
            <label className="usa-label" htmlFor="options">
                Procurement Shop
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="options"
                    id="options"
                    onChange={(e) => onChangeProcurementShopSelection(Number(e.target.value) || 0)}
                    value={selectedProcurementShop?.id}
                    required
                >
                    <option value={0}>- Select -</option>
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
        </fieldset>
    );
};
