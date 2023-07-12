import cx from "clsx";

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
 * @returns {JSX.Element} - The rendered component.
 */
export const ProductServiceCodeSelect = ({
    name,
    label = name,
    selectedProductServiceCode,
    onChange,
    codes: productServiceCodes,
    pending = false,
    messages = [],
    className,
}) => {
    const handleChange = (e) => {
        onChange(name, e.target.selectedIndex);
    };

    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label className={`usa-label ${messages.length ? "usa-label--error" : null} `} htmlFor={name}>
                {label}
            </label>
            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : null}
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className={`usa-select margin-top-0 width-fit-content ${
                        messages.length ? "usa-input--error" : null
                    }`}
                    name={name}
                    id={name}
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
        </div>
    );
};

export default ProductServiceCodeSelect;
