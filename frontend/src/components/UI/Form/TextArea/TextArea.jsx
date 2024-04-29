import cx from "clsx";
import PropTypes from "prop-types";

/**
 * A textarea input component.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.label=name] - The label for the input field.
 * @param {string} [props.hintMsg] - The hint message for the input field.
 * @param {function} props.onChange - The change handler for the input field.
 * @param {boolean} [props.pending=false] - Whether the input field is pending.
 * @param {string[]} [props.messages=[]] - The error messages for the input field.
 * @param {string} props.value - The value of the input field.
 * @param {number} props.maxLength - The maximum number of characters allow.
 * @param {string} [props.className] - The CSS class for the input field.
 * @param {Object} [props.textAreaStyle] - The style for the textarea.
 * @returns {JSX.Element} - The textarea input component.
 */
export const TextArea = ({
    name,
    label = name,
    hintMsg,
    onChange,
    pending = false,
    messages = [],
    value,
    maxLength,
    className,
    textAreaStyle = { height: "8.5rem" }
}) => {
    if (!hintMsg && maxLength) hintMsg = `Maximum ${maxLength} characters`;
    return (
        <div className="usa-character-count">
            <div className={cx("usa-form-group", pending && "pending", className)}>
                <label
                    className={`usa-label ${messages.length ? "usa-label--error" : ""} `}
                    htmlFor={name}
                >
                    {label}
                </label>

                {messages.length ? (
                    <span
                        className="usa-error-message"
                        id="text-area-input-error-message"
                        role="alert"
                    >
                        {messages[0]}
                    </span>
                ) : (
                    <span
                        id={`${name}-with-hint-textarea-hint`}
                        className="usa-hint"
                    >
                        {hintMsg}
                    </span>
                )}
                <textarea
                    className={`usa-textarea ${messages.length ? "usa-input--error" : ""} `}
                    id={name}
                    name={name}
                    rows={5}
                    style={textAreaStyle}
                    maxLength={maxLength}
                    onChange={handleChange}
                    value={value}
                    aria-describedby={`${name}-with-hint-textarea-info ${name}-with-hint-textarea-hint`}
                />
            </div>
            <span
                id={`${name}-with-hint-textarea-info`}
                className="usa-character-count__message sr-only"
            >
                You can enter up to {maxLength} characters
            </span>
        </div>
    );
    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

TextArea.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    hintMsg: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    pending: PropTypes.bool,
    messages: PropTypes.array,
    value: PropTypes.string.isRequired,
    maxLength: PropTypes.number,
    className: PropTypes.string,
    textAreaStyle: PropTypes.object
};

export default TextArea;
