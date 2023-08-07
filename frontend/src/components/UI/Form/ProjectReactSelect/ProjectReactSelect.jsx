import PropTypes from "prop-types";
import Select from "react-select";
import { useEffect, useState } from "react";

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
    const [selectedOption, setSelectedOption] = useState(null);

    const options = researchProjects.map((project) => {
        return { value: project.id, label: project.title };
    });

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            background: "#fff",
            borderColor: "565c65",
            minHeight: "40px",
            height: "40px",
            boxShadow: state.isFocused ? null : null,
            outline: state.isFocused ? "0.25rem solid #2491ff" : null,
            borderRadius: 0,
        }),

        placeholder: (provided) => ({
            ...provided,
            color: "#1b1b1b",
        }),

        valueContainer: (provided) => ({
            ...provided,
            height: "40px",
            padding: "0 6px",
        }),

        input: (provided) => ({
            ...provided,
            margin: "0px",
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: "40px",
        }),
    };

    useEffect(() => {
        selectedResearchProject === undefined && setSelectedOption(null);
    }, [selectedResearchProject]);

    const handleChange = (e, actionObj) => {
        if (actionObj.action === "clear") {
            setSelectedProject({});
            setSelectedOption(null);
        } else {
            const projId = e.value;
            const projObj = researchProjects.find((proj) => proj.id === Number(projId));
            setSelectedProject(projObj);

            const option = options.find((option) => option.value === Number(projId));
            setSelectedOption(option);
        }
    };

    const defaultOption = selectedResearchProject
        ? options.find((option) => option.value === Number(selectedResearchProject?.id))
        : null;

    return (
        <div className="display-flex flex-justify">
            <div className="left-half width-full">
                <label className={legendClassname} htmlFor="project" id="project-label">
                    Project
                </label>
                <div className="" data-enhanced="true">
                    <Select
                        className="margin-0"
                        classNamePrefix={"project-react-select"}
                        data-cy="project-react-select"
                        data-testid="project-react-select"
                        name="project-react-select"
                        tabIndex="0"
                        value={defaultOption ?? selectedOption}
                        onChange={handleChange}
                        options={options}
                        placeholder={defaultString}
                        styles={customStyles}
                        isSearchable={true}
                        isClearable={true}
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
