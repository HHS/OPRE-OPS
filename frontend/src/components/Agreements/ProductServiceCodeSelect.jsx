import cx from "clsx";
import Tooltip from "../UI/USWDS/Tooltip";

/**
 * A select input for choosing a product service code.
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {Object} props.selectedProductServiceCode - The currently selected product service code.
 * @param {Function} props.onChange - A function to call when the input value changes.
 * @param {Array<Object>} props.codes - An array of product service codes.
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {boolean} [props.isDisabled] - A flag to indicate if the input is disabled (optional).
 * @param {string} [props.tooltipMsg] - Tooltip message to display (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const ProductServiceCodeSelect = ({
    name,
    label = name,
    selectedProductServiceCode,
    onChange,
    codes: productServiceCodes,
    pending = false,
    messages = [],
    className = "",
    isDisabled = false,
    tooltipMsg = ""
}) => {
    const handleChange = (e) => {
        onChange(name, e.target.selectedIndex);
    };

    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label
                className={`usa-label ${messages.length ? "usa-label--error" : null} `}
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
            <div className="display-flex flex-align-center margin-top-1">
                {isDisabled ? (
                    <Tooltip
                        label={tooltipMsg}
                        position="right"
                    >
                        <select
                            className={"width-mobile-lg usa-select margin-top-0"}
                            name={name}
                            id={name}
                            value={selectedProductServiceCode?.name}
                            required
                            disabled={isDisabled}
                        >
                            <option value={selectedProductServiceCode?.name}>{selectedProductServiceCode?.name}</option>
                        </select>
                    </Tooltip>
                ) : (
                    <select
                        className={`usa-select margin-top-0 ${messages.length ? "usa-input--error" : ""}`}
                        name={name}
                        id={name}
                        onChange={handleChange}
                        value={selectedProductServiceCode?.name}
                        required
                        disabled={isDisabled}
                    >
                        <option value={0}>- Select a Product Service Code -</option>
                        {productServiceCodes.map((psc) => (
                            <option
                                key={psc?.id}
                                value={psc?.name}
                            >
                                {psc?.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
};

export default ProductServiceCodeSelect;
