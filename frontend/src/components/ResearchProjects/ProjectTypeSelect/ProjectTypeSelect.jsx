const PROJECT_TYPES = ["Research"];

export const ProjectTypeSelect = ({ selectedProjectType, onChangeProjectTypeSelection }) => {
    return (
        <>
            <label className="usa-label" htmlFor="project-type-select-options">
                Project Type
            </label>
            <div className="display-flex flex-align-center margin-top-1">
                <select
                    className="usa-select margin-top-0 width-card-lg"
                    name="project-type-select-options"
                    id="project-type-select-options"
                    onChange={(e) => onChangeProjectTypeSelection(e.target.value || 0)}
                    value={selectedProjectType || ""}
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
};

export default ProjectTypeSelect;
