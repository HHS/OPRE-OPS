import cx from "clsx";

const Input = ({ name, label = name, onChange, pending = false, messages = [], value, className }) => {
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
            <input
                id={name}
                name={name}
                className={`usa-input ${messages.length ? "usa-input--error" : null} `}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                value={value}
            />
        </div>
    );

    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

export default Input;
