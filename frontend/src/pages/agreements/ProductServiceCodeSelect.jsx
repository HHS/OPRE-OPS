import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProductServiceCodesList, setAgreementProductServiceCode } from "./createAgreementSlice";
import { getAllProductServiceCodes } from "../../api/getProductServiceCodes";

export const ProductServiceCodeSelect = () => {
    const dispatch = useDispatch();
    const productServiceCodes = useSelector((state) => state.createAgreement.product_service_codes_list);
    const selectedProductServiceCode = useSelector(
        (state) => state.createAgreement.agreement.selected_product_service_code
    );

    // On component load, get ProductServiceCodes from API, and set returned list in State
    useEffect(() => {
        const getProductServiceCodesAndSetState = async () => {
            dispatch(setProductServiceCodesList(await getAllProductServiceCodes()));
        };

        getProductServiceCodesAndSetState().catch(console.error);

        return () => {
            dispatch(setProductServiceCodesList([]));
        };
    }, [dispatch]);

    const onChangeProductServiceCodeSelection = (productServiceCode = null) => {
        if (productServiceCode === null || productServiceCode === "0") {
            dispatch(setAgreementProductServiceCode(null));
            return;
        }

        dispatch(setAgreementProductServiceCode(productServiceCode));
    };

    return (
        <>
            <label className="usa-label" htmlFor="options">
                Product Service Code
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="options"
                    id="options"
                    onChange={(e) => {
                        const selectedOptionIndex = e.target.selectedIndex;
                        const selectedProductServiceCode = productServiceCodes[selectedOptionIndex - 1];
                        onChangeProductServiceCodeSelection(selectedProductServiceCode);
                    }}
                    value={selectedProductServiceCode?.name}
                    required
                >
                    <option value={0}>- Select a Product Service Code -</option>
                    {productServiceCodes.map((psc) => (
                        <option key={psc?.id} value={psc?.name}>
                            {psc?.name}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default ProductServiceCodeSelect;
