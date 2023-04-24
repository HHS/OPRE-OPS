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

    // On component load, get AgreementTypes from API, and set returned list in State
    useEffect(() => {
        const getProductServiceCodesAndSetState = async () => {
            dispatch(setProductServiceCodesList(await getAllProductServiceCodes()));
        };

        getProductServiceCodesAndSetState().catch(console.error);

        return () => {
            dispatch(setProductServiceCodesList([]));
        };
    }, [dispatch]);

    const onChangeAgreementTypeSelection = (agreementType = null) => {
        if (agreementType === null || agreementType === "0") {
            dispatch(setAgreementProductServiceCode(null));
            return;
        }

        dispatch(setAgreementProductServiceCode(agreementType));
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
                    onChange={(e) => onChangeAgreementTypeSelection(e.target.value || null)}
                    value={selectedProductServiceCode}
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
