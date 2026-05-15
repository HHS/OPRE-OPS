import cx from "clsx";
import IsRequiredHelper from "../../UI/Form/IsRequiredHelper";

/**
 * @component
 * @param {Object} props
 * @param {string} props.name
 * @param {string} [props.label]
 * @param {Function} props.onChange
 * @param {boolean} [props.pending]
 * @param {string[]} [props.messages]
 * @param {string} props.value
 * @param {string} [props.className]
 * @param {boolean} [props.isRequired]
 * @returns {React.ReactElement}
 */
export const ProjectTypeSelect = ({
    name,
    label = name,
    onChange,
    pending = false,
    messages = [],
    value,
    className,
    isRequired = false
}) => {
    const PROJECT_TYPES = [
        { value: "Research", label: "Research Projects" },
        { value: "Admin & Support", label: "Admin/Support Projects" }
    ];

    return (
        <div className={cx("usa-form-group", pending && "pending", className)}>
            <label
                className={`usa-label ${messages.length ? "usa-label--error" : null} `}
                htmlFor={name}
            >
                {label}
            </label>
            {messages.length ? (
                <span
                    className="usa-error-message"
                    id="project-type-select-input-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            ) : (
                <IsRequiredHelper isRequired={isRequired} />
            )}
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    id={name}
                    name={name}
                    className={`usa-select margin-top-0 width-card-lg ${messages.length ? "usa-input--error" : null} `}
                    onChange={handleChange}
                    value={value}
                    data-cy="project-type-select"
                >
                    <option
                        value=""
                        disabled
                        hidden
                    >
                        - Select Project Type -
                    </option>
                    {PROJECT_TYPES.map((type) => (
                        <option
                            key={type.value}
                            value={type.value}
                        >
                            {type.label}
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
