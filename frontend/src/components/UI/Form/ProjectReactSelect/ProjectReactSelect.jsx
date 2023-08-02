import PropTypes from "prop-types";
import Select from "react-select";
import { useState } from "react";

export const ProjectReactSelect = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
}) => {
    const [selectedOption, setSelectedOption] = useState(null);

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            background: "#fff",
            borderColor: "#9e9e9e",
            minHeight: "40px",
            height: "40px",
            boxShadow: state.isFocused ? null : null,
            borderRadius: 0,
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

    const handleChange = (e) => {
        const projId = e.value;
        const projObj = researchProjects.find((proj) => proj.id === Number(projId));
        setSelectedOption(projId);
        setSelectedProject(projObj);
    };

    let options = researchProjects.map((project) => {
        return { value: project.id, label: project.title };
    });

    const defaultOption = options.find((option) => option.value === Number(selectedResearchProject?.id));

    return (
        <div className="display-flex flex-justify">
            <div className="left-half width-full">
                <label className={legendClassname} htmlFor="project" id="project-label">
                    Project
                </label>
                <div className="" data-enhanced="true">
                    <Select
                        className="margin-0"
                        data-cy="project-select"
                        data-testid="project-select"
                        name="project"
                        tabIndex="-1"
                        defaultValue={defaultOption ?? selectedOption}
                        onChange={handleChange}
                        options={options}
                        placeholder={defaultString}
                        styles={customStyles}
                        isSearchable={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectReactSelect;

ProjectReactSelect.propTypes = {
    researchProjects: PropTypes.array.isRequired,
    selectedResearchProject: PropTypes.object.isRequired,
    setSelectedProject: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
};
