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
    messages = [],
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div className={messages.length ? "usa-form-group usa-form-group--error" : "usa-form-group"}>
                <label
                    className={`${legendClassname} ${messages.length ? "usa-label--error" : ""}`}
                    htmlFor="project-combobox-input"
                >
                    Project
                </label>
                {messages?.length > 0 && (
                    <span
                        className="usa-error-message"
                        id="project-combobox-input-error-message"
                        role="alert"
                    >
                        {messages[0]}
                    </span>
                )}
                <div>
                    <ComboBox
                        namespace="project-combobox"
                        data={researchProjects}
                        selectedData={selectedResearchProject}
                        setSelectedData={setSelectedProject}
                        optionText={(project) =>
                            project.short_title ? `${project.title} (${project.short_title})` : project.title
                        }
                        messages={messages}
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
    messages: PropTypes.arrayOf(PropTypes.string),
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object
};
