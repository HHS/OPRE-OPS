import PropTypes from "prop-types";

export const ProjectSelectComboBox = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
}) => {
    const handleChange = (e) => {
        const projId = e.target.value;
        console.log("projId: ", projId);

        if (projId === "0") {
            setSelectedProject({});
        } else {
            const projObj = researchProjects.find((proj) => proj.id === Number(projId));
            console.log("projObj: ", projObj);

            setSelectedProject(projObj);
        }
    };

    return (
        <div className="display-flex flex-justify">
            <div className="left-half width-full">
                <label className={legendClassname} htmlFor="project" id="project-label">
                    Project
                </label>
                <div className="" data-enhanced="true">
                    <select
                        className="usa-select margin-0"
                        data-cy="project-select"
                        data-testid="project-select"
                        name="project"
                        tabIndex="-1"
                        value={selectedResearchProject?.id}
                        onChange={handleChange}
                    >
                        <option key={0} value={0}>
                            {defaultString}
                        </option>
                        {researchProjects.map((project) => {
                            return (
                                <option key={project?.id} value={project?.id}>
                                    {project?.title}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelectComboBox;

ProjectSelectComboBox.propTypes = {
    researchProjects: PropTypes.array.isRequired,
    selectedResearchProject: PropTypes.object.isRequired,
    setSelectedProject: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
};
