import cx from "clsx";

/**
 * A form input component.
 *
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label] - The label to display for the input field (optional).
 * @param {boolean} [props.pending] - A flag to indicate if the input is pending (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {string} [props.value] - The value of the input field.(optional)
 * @param {string} [props.className] - Additional CSS classes to apply to the component (optional).
 * @returns {JSX.Element} - The rendered input component.
 */
const Terms = ({ name, label = name, pending = false, messages = [], value, className }) => {
    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <dt className="margin-0 text-base-dark margin-top-3">{label}</dt>
            <dd className="text-semibold margin-0 margin-top-05">
                {value || "TBD"}
                {messages.length ? (
                    <span className="usa-error-message" role="alert">
                        {messages[0]}
                    </span>
                ) : null}
            </dd>
        </div>
    );
};

export default Terms;
