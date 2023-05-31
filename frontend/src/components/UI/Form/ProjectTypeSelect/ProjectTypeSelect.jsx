import cx from "clsx";

export const ProjectTypeSelect = ({
    name,
    label = name,
    onChange,
    pending = false,
    messages = [],
    value,
    className,
}) => {
    const PROJECT_TYPES = ["Research"];

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
                    id={name}
                    name={name}
                    className={`usa-select margin-top-0 width-card-lg ${messages.length ? "usa-input--error" : null} `}
                    onChange={handleChange}
                    value={value}
                >
                    <option value={0}>- Select Project Type -</option>
                    {PROJECT_TYPES.map((type, index) => (
                        <option key={index + 1} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

export default ProjectTypeSelect;
