const PROJECT_TYPES = ["Research"];

export const ProjectTypeSelect = ({
    name,
    label = name,
    onChange,
    pending = false,
    messages = [],
    value,
    selectedProjectType,
    onChangeProjectTypeSelection,
}) => {
    return (
        <>
            <label className="usa-label" htmlFor={name}>
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
                    className="usa-select margin-top-0 width-card-lg"
                    onChange={handleChange}
                    value={value}
                    required
                >
                    <option value={0}>- Select Project Type -</option>
                    {PROJECT_TYPES.map((type, index) => (
                        <option key={index + 1} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );

    function handleChange(e) {
        onChange(name, e.target.value);
    }
};

export default ProjectTypeSelect;
