import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProductServiceCodesList, setAgreementProductServiceCode } from "./createAgreementSlice";
import { getAllProductServiceCodes } from "../../api/getProductServiceCodes";

export const ProductServiceCodeSelect = () => {
    const dispatch = useDispatch();
    const productServiceCodes = useSelector((state) => state.createAgreement.product_service_codes_list);
    const selectedProductServiceCode = useSelector(
        (state) => state.createAgreement.agreement.selectedProductServiceCode
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
        if (agreementType === null) {
            dispatch(setAgreementProductServiceCode(null));
            return;
        }

        dispatch(setAgreementProductServiceCode(agreementType));
    };

    const ProductServiceCodeSummary = () => {
        return (
            <div
                className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
                style={{ width: "23.9375rem", minHeight: "7.5625rem" }}
            >
                <dl className="margin-0 padding-y-2 padding-x-105">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="text-semibold margin-0">{selectedProductServiceCode.name}</dd>
                </dl>
            </div>
        );
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
                    value={selectedProductServiceCode?.value}
                    required
                >
                    <option value={0}>- Select a Product Service Code -</option>
                    {productServiceCodes.map((psc) => (
                        <option key={psc?.id} value={psc?.name}>
                            {psc?.name}
                        </option>
                    ))}
                </select>
                <div>{selectedProductServiceCode?.id && <ProductServiceCodeSummary />}</div>
            </div>
        </>
    );
};

export default ProductServiceCodeSelect;
