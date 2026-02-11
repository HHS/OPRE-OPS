import { useMemo } from "react";
import ComboBox from "../../UI/Form/ComboBox";

/**
 * A comboBox for choosing Project Title(s).
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedProjects - The currently selected projects.
 * @param {Function} props.setSelectedProjects - A function to call when the selected projects change.
 * @param {Object} props.agreementFilterOptions - The filter options from API containing project_titles.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {React.ReactElement} - The rendered component.
 */
export const ProjectTitleComboBox = ({
    selectedProjects,
    setSelectedProjects,
    agreementFilterOptions,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = { minWidth: "22.7rem" }
}) => {
    // Transform project_titles data to ComboBox format
    const projectOptions = useMemo(() => {
        if (!agreementFilterOptions?.project_titles) return [];

        return agreementFilterOptions.project_titles.map((project) => ({
            id: project.id,
            title: project.name
        }));
    }, [agreementFilterOptions]);

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-title-combobox-input"
                >
                    Project Title
                </label>
                <div>
                    <ComboBox
                        namespace="project-title-combobox"
                        data={projectOptions}
                        selectedData={selectedProjects}
                        setSelectedData={setSelectedProjects}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectTitleComboBox;
