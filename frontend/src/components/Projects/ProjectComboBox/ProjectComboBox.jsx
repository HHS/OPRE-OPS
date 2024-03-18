import PropTypes from "prop-types";
import ComboBox from "../../UI/Form/ComboBox";

/**
 *  A comboBox for choosing a project.
 * @param {Object} props - The component props.
 * @param {array} props.researchProjects - The projects to choose from.
 * @param {Object} props.selectedResearchProject - The currently selected project.
 * @param {Function} props.setSelectedProject - A function to call when the selected project changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ProjectComboBox = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-combobox-input"
                >
                    Project
                </label>
                <div>
                    <ComboBox
                        namespace="project-combobox"
                        data={researchProjects}
                        selectedData={selectedResearchProject}
                        setSelectedData={setSelectedProject}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectComboBox;

ProjectComboBox.propTypes = {
    researchProjects: PropTypes.array.isRequired,
    selectedResearchProject: PropTypes.object,
    setSelectedProject: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object
};
