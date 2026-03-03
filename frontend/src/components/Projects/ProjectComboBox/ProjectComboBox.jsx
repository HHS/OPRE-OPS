import ComboBox from "../../UI/Form/ComboBox";

/**
 * @typedef {Object} ProjectOption
 * @property {number} id - Project identifier.
 * @property {string} title - Project title shown in the combobox.
 * @property {string} [short_title] - Optional project nickname/acronym used for display/search.
 */

/**
 * A comboBox for choosing a project.
 * Supports type-ahead on both project title and nickname by rendering options as
 * `Title (Short Title)` when `short_title` is available.
 *
 * @param {Object} props - The component props.
 * @param {ProjectOption[]} props.researchProjects - The projects to choose from.
 * @param {ProjectOption | null | undefined} props.selectedResearchProject - The currently selected project.
 * @param {(project: ProjectOption | null) => void} props.setSelectedProject - Called when project selection changes.
 * @param {string[]} [props.messages] - Validation messages displayed above the combobox input.
 * @param {string} [props.label] - Field label text.
 * @param {boolean} [props.isRequired] - When true, shows `Required Information*` hint if no error is present.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {React.ReactElement} The rendered component.
 */
export const ProjectComboBox = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    messages = [],
    label = "Project",
    isRequired = false,
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
                    {label}
                </label>
                {messages?.length > 0 ? (
                    <span
                        className="usa-error-message margin-top-neg-1"
                        id="project-combobox-input-error-message"
                        role="alert"
                    >
                        {messages[0]}
                    </span>
                ) : (
                    isRequired && <div className="usa-hint margin-top-neg-1">Required Information*</div>
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
