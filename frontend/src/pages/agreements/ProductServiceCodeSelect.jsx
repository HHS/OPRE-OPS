import { useGetProductServiceCodesQuery } from "../../api/opsAPI";

export const ProductServiceCodeSelect = ({ selectedProductServiceCode, setSelectedProductServiceCode }) => {
    const {
        data: productServiceCodes,
        error: errorProductServiceCodes,
        isLoading: isLoadingProductServiceCodes,
    } = useGetProductServiceCodesQuery();

    if (isLoadingProductServiceCodes) {
        return <div>Loading...</div>;
    }
    if (errorProductServiceCodes) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        const selectedOptionIndex = e.target.selectedIndex;
        const selectedProductServiceCode = productServiceCodes[selectedOptionIndex - 1];
        setSelectedProductServiceCode(selectedProductServiceCode);
    };

    return (
        <>
            <label className="usa-label" htmlFor="product-service-code-options">
                Product Service Code
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-fit-content"
                    name="product-service-code-options"
                    id="product-service-code-options"
                    onChange={handleChange}
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
