export const ProjectSelect = () => {
    return (
        <div className="usa-form-group">
            <label className="usa-label" htmlFor="opsProjects">
                Projects
            </label>
            <input
                className="usa-input border-right"
                list="projects"
                id="opsProjects"
                name="opsProjects"
                type="search"
            />
            <datalist id="projects">
                <option value="Red-X 2.0" />
                <option value="Green-X 2.0" />
                <option value="Blue-X 1.0" />
            </datalist>
        </div>
    );
};
