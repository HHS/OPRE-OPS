import { useGetProcurementShopsQuery } from "../../../api/opsAPI";
import cx from "clsx";
import ErrorPage from "../../../pages/ErrorPage";
import Tooltip from "../../UI/USWDS/Tooltip";

/**  @typedef {import("../../../types/AgreementTypes").ProcurementShop} ProcurementShop */
/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {ProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {string} props.name - The name for the input
 * @param {string} props.label - The label for the input
 * @param {string[]} props.messages - The array of validation error strings
 * @param {boolean} props.pending - validation is pending
 * @param {string[]} props.className - classnames for styling
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {boolean} [props.isDisabled] - Whether the select is disabled (optional).
 * @param {string} [props.disabledMessage] - Message to display when the select is disabled (optional).
 * @returns {React.ReactElement} - The procurement shop select element.
 */
const ProcurementShopSelect = ({
    selectedProcurementShop,
    name,
    label = name,
    pending,
    className,
    onChangeSelectedProcurementShop,
    legendClassname = "",
    defaultString = "-Select Procurement Shop-",
    isDisabled = false,
    disabledMessage = "Disabled",
    messages = []
}) => {
    /** @type {{data?: ProcurementShop[] | undefined, error?: Object,  isLoading: boolean}} */
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops
    } = useGetProcurementShopsQuery({});

    if (isLoadingProcurementShops) {
        return <div>Loading...</div>;
    }

    if (errorProcurementShops) {
        return <ErrorPage />;
    }

    const handleChange = (e) => {
        const procurementShopId = e.target.value;

        if (!procurementShops) return;

        onChangeSelectedProcurementShop(
            procurementShopId === "0"
                ? undefined
                : procurementShops.find((shop) => shop.id === parseInt(procurementShopId))
        );
    };

    return (
        <>
            <fieldset
                className={cx("usa-fieldset", pending && "pending", className)}
                disabled={isDisabled}
            >
                <label
                    className={cx("usa-label", "margin-top", legendClassname, messages.length && "usa-label--error")}
                    htmlFor={name}
                >
                    {label}
                </label>
                {messages.length > 0 && (
                    <span
                        className="usa-error-message"
                        role="alert"
                    >
                        {messages[0]}
                    </span>
                )}
                <div className="display-flex flex-align-center">
                    {isDisabled ? (
                        <Tooltip
                            position="right"
                            label={disabledMessage}
                        >
                            <select
                                className="usa-select margin-top-1"
                                name={name}
                                id={name}
                                onChange={handleChange}
                                value={selectedProcurementShop?.id}
                                required
                            >
                                <option value="">{selectedProcurementShop?.name || defaultString}</option>
                            </select>
                        </Tooltip>
                    ) : (
                        <select
                            className={`usa-select margin-top-1 ${messages.length ? "usa-input--error" : ""}`}
                            name={name}
                            id={name}
                            onChange={handleChange}
                            value={selectedProcurementShop?.id || 0}
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
