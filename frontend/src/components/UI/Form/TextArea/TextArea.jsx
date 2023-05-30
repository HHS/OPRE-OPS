import cx from "clsx";

export const TextArea = ({
    name,
    label = name,
    hintMsg,
    onChange,
    pending = false,
    messages = [],
    value,
    className,
}) => {
    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label className={`usa-label ${messages.length ? "usa-label--error" : null} `} htmlFor={name}>
                {label}
            </label>

            {messages.length ? (
                <span className="usa-error-message" id="input-error-message" role="alert">
                    {messages[0]}
                </span>
            ) : (
                <span id="with-hint-textarea-hint" className="usa-hint">
                    {hintMsg}
                </span>
            )}
            <textarea
                className={`usa-textarea ${messages.length ? "usa-input--error" : null} `}
                id={name}
                name="description"
                rows="5"
                style={{ height: "7rem" }}
                onChange={handleChange}
                value={value}
            ></textarea>
        </div>
    );
    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

export default TextArea;
