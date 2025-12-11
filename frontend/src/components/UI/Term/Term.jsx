import cx from "clsx";

/**
    @typedef {Object} TermProps
    @property {string} name
    @property {string} [label]
    @property {boolean} [pending]
    @property {string[]} [messages]
    @property {string | number} value
    @property {string} [className]
    @property {string} [dataCy]
*/

/**
 * This component needs to wrapped in a <dl> element.
 * @component - Renders a term with a label and value.
 * @param {TermProps} props - The properties passed to the component.
 * @returns {JSX.Element} - The rendered input component.
 */
const Term = ({ name, label = name, pending = false, messages = [], value = "TBD", className, dataCy = "" }) => {
    return (
        <div
            className={cx(
                "usa-form-group margin-top-1",
                pending && "pending",
                className === "usa-form-group--error" ? "margin-left-0" : "",
                className
            )}
            data-testid="term-container"
        >
            <dt className={cx("margin-0 text-base-dark margin-top-2")}>{label}</dt>
            <dd
                className={cx("text-semibold margin-0 margin-top-05 wrap-text")}
                data-cy={dataCy}
            >
                {value}
                {messages.length > 0 && (
                    <span
                        className="usa-error-message text-normal"
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
