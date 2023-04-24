import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedProcurementShop, setProcurementShopsList } from "./createAgreementSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";

export const ProcurementShopSelect = () => {
    const dispatch = useDispatch();
    const procurementShops = useSelector((state) => state.createAgreement.procurement_shops_list);
    const selectedProcurementShop = useSelector((state) => state.createAgreement.selected_procurement_shop);
    console.log(`Proc_shops: ${procurementShops}`);

    useEffect(() => {
        const getProcurementShopsAndSetState = async () => {
            dispatch(setProcurementShopsList(await getProcurementShopList()));
        };
        getProcurementShopsAndSetState().catch(console.error);

        return () => {
            dispatch(setProcurementShopsList([]));
        };
    }, [dispatch]);

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
        <fieldset className="usa-fieldset">
            <label className="usa-label" htmlFor="procurement-shop-select">
                Procurement Shop
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="procurement-shop-select"
                    id="procurement-shop-select"
                    onChange={(e) => onChangeProcurementShopSelection(Number(e.target.value) || 0)}
                    value={selectedProcurementShop?.id}
                    required
                >
                    <option value={0}>- Select a Procurement Shop -</option>
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

export default ProcurementShopSelect;
