import { useEffect, useState } from "react";
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
 * @param {boolean} [props.defaultToGCS] - Whether to initially select GCS (optional).
 * @param {boolean} [props.isFilter] - Whether the select is used as a filter (optional).
 * @returns {React.ReactElement} - The procurement shop select element.
 */
export const ProcurementShopSelect = ({
    selectedProcurementShop,
    onChangeSelectedProcurementShop,
    legendClassname = "",
    defaultString = "-Select Procurement Shop-",
    defaultToGCS = true,
    isFilter = false
}) => {
    const [hasSelectedDefault, setHasSelectedDefault] = useState(defaultToGCS);
    /** @type {{data?: ProcurementShop[] | undefined, error?: Object,  isLoading: boolean}} */
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops
    } = useGetProcurementShopsQuery({});

    useEffect(() => {
        if (defaultToGCS && !selectedProcurementShop?.id && procurementShops) {
            onChangeSelectedProcurementShop(procurementShops[1]);
        }
    }, [defaultToGCS, procurementShops, selectedProcurementShop, onChangeSelectedProcurementShop]);

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
            fee: procurementShops[procurementShopId - 1].fee_percentage
        };
        onChangeSelectedProcurementShop(procurementShop);

        setHasSelectedDefault(procurementShop.id === 2);
    };
    const showValidation = !isFilter && !hasSelectedDefault;

    return (
        <fieldset className={`usa-fieldset ${showValidation ? "usa-form-group--error" : ""}`}>
            <label
                className={`usa-label margin-top-0 ${legendClassname} ${showValidation ? "usa-label--error" : ""}`}
                htmlFor="procurement-shop-select"
            >
                Procurement Shop
            </label>
            {showValidation && <span className="usa-error-message">GCS is the only available type for now</span>}
            <div className="display-flex flex-align-center">
                <select
                    className={`usa-select margin-top-1 ${showValidation ? "usa-input--error" : ""}`}
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
    );
};

export default ProcurementShopSelect;
