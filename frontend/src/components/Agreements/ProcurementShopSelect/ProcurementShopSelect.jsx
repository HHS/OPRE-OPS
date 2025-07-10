import React from "react";
import { useGetProcurementShopsQuery } from "../../../api/opsAPI";
import ErrorPage from "../../../pages/ErrorPage";
import Tooltip from "../../UI/USWDS/Tooltip";

/**  @typedef {import("../../../types/AgreementTypes").ProcurementShop} ProcurementShop */
/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {ProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {boolean} [props.isDisabled] - Whether the select is disabled (optional).
 * @param {string} [props.disabledMessage] - Message to display when the select is disabled (optional).
 * @returns {React.ReactElement} - The procurement shop select element.
 */
const ProcurementShopSelect = ({
    selectedProcurementShop,
    onChangeSelectedProcurementShop,
    legendClassname = "",
    defaultString = "-Select Procurement Shop-",
    isDisabled = false,
    disabledMessage = "Disabled"
}) => {
    /** @type {{data?: ProcurementShop[] | undefined, error?: Object,  isLoading: boolean}} */
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops
    } = useGetProcurementShopsQuery({});

    // NOTE: set the GCS Procurement Shop as the default selected shop on component mount
    React.useEffect(() => {
        if (procurementShops && !selectedProcurementShop) {
            onChangeSelectedProcurementShop(procurementShops[0]);
        }
    }, [procurementShops, selectedProcurementShop, onChangeSelectedProcurementShop]);

    if (isLoadingProcurementShops) {
        return <div>Loading...</div>;
    }

    if (errorProcurementShops) {
        return <ErrorPage />;
    }

    const handleChange = (e) => {
        const procurementShopId = e.target.value;

        if (!procurementShops) return;

        onChangeSelectedProcurementShop(procurementShops[procurementShopId - 1]);
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
                    {isDisabled ? (
                        <Tooltip
                            position="right"
                            label={disabledMessage}
                        >
                            <select
                                className="usa-select margin-top-1"
                                name="procurement-shop-select"
                                id="procurement-shop-select"
                                onChange={handleChange}
                                value={selectedProcurementShop?.id}
                                required
                            >
                                <option value="">{selectedProcurementShop?.name || defaultString}</option>
                            </select>
                        </Tooltip>
                    ) : (
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
                    )}
                </div>
            </fieldset>
        </>
    );
};

export default ProcurementShopSelect;
