import ComboBox from "../../UI/Form/ComboBox";
import { PROJECT_TYPE_RESEARCH, PROJECT_TYPE_ADMIN_SUPPORT, PROJECT_TYPE_LABELS } from "../ProjectTypes.constants";

/**
 * A comboBox for choosing Project Type(s).
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedProjectTypes - The currently selected project types.
 * @param {Function} props.setSelectedProjectTypes - A function to call when the selected project types change.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const ProjectTypeComboBox = ({
    selectedProjectTypes,
    setSelectedProjectTypes,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = { minWidth: "22.7rem" }
}) => {
    const projectTypeOptions = [
        {
            id: PROJECT_TYPE_RESEARCH,
            title: PROJECT_TYPE_LABELS[PROJECT_TYPE_RESEARCH],
            name: PROJECT_TYPE_RESEARCH
        },
        {
            id: PROJECT_TYPE_ADMIN_SUPPORT,
            title: PROJECT_TYPE_LABELS[PROJECT_TYPE_ADMIN_SUPPORT],
            name: PROJECT_TYPE_ADMIN_SUPPORT
        }
    ];

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-type-combobox-input"
                >
                    Project Type
                </label>
                <div>
                    <ComboBox
                        namespace="project-type-combobox"
                        data={projectTypeOptions}
                        selectedData={selectedProjectTypes}
                        setSelectedData={setSelectedProjectTypes}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectTypeComboBox;
