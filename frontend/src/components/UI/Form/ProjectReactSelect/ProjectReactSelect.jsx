import PropTypes from "prop-types";
import ComboBox from "../ComboBox";

/**
 *  A comboBox for choosing a project.
 * @param {Object} props - The component props.
 * @param {array} props.researchProjects - The projects to choose from.
 * @param {Object} props.selectedResearchProject - The currently selected project.
 * @param {Function} props.setSelectedProject - A function to call when the selected project changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ProjectReactSelect = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
}) => {
    return (
        <div className="display-flex flex-justify">
            <div className="left-half width-full">
                <label className={legendClassname} htmlFor="project" id="project-label">
                    Project
                </label>
                <div>
                    <ComboBox
                        namespace="project-react-select"
                        data={researchProjects}
                        selectedData={selectedResearchProject}
                        setSelectedData={setSelectedProject}
                        defaultString={defaultString}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectReactSelect;

ProjectReactSelect.propTypes = {
    researchProjects: PropTypes.array.isRequired,
    selectedResearchProject: PropTypes.object,
    setSelectedProject: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
};
