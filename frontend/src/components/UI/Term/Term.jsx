import cx from "clsx";

/**
    @typedef {Object} TermProps
    @property {string} name
    @property {string} [label]
    @property {boolean} [pending]
    @property {string[]} [messages]
    @property {string | number} value
    @property {string} [className]
*/

/**
 * @component - Renders a term with a label and value.
 * @param {TermProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered input component.
 */
const Term = ({ name, label = name, pending = false, messages = [], value = "TDB", className }) => {
    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <dt className="margin-0 text-base-dark margin-top-3">{label}</dt>
            <dd className="text-semibold margin-0 margin-top-05">
                {value}
                {messages.length > 0 && (
                    <span
                        className="usa-error-message"
                        role="alert"
                    >
                        {messages[0]}
                    </span>
                )}
            </dd>
        </div>
    );
};

export default Term;
