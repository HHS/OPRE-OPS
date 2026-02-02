import cx from "clsx";

/**
 * A textarea input component.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} [props.hintMsg] - The hint message for the input field.
 * @param {function} props.onChange - The change handler for the input field.
 * @param {string} props.value - The value of the input field.
 * @param {number} props.maxLength - The maximum number of characters allow.
 * @param {string} [props.className] - The CSS class for the input field.
 * @param {Object} [props.textAreaStyle] - The style for the textarea.
 * @param {boolean} [props.isDisabled] - Whether control is disabled
 * @param {string} [props.label=name] - The label for the input field.
 * @param {boolean} [props.pending=false] - Whether the input field is pending.
 * @param {string[]} [props.messages=[]] - The error messages for the input field.
 * @returns {React.ReactElement} - The textarea input component.
 */
export const TextArea = ({
    name,
    hintMsg,
    onChange,
    value,
    maxLength,
    className,
    textAreaStyle = { height: "8.5rem" },
    isDisabled = false,
    label = name,
    pending = false,
    messages = []
}) => {
    if (!hintMsg && maxLength) hintMsg = `Maximum ${maxLength} characters`;
    return (
        <fieldset
            disabled={isDisabled}
            className="usa-character-count usa-fieldset"
        >
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
        </fieldset>
    );
    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

export default TextArea;
