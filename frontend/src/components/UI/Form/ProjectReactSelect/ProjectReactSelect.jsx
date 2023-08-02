import PropTypes from "prop-types";
import Select from "react-select";
import { useEffect, useState } from "react";

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
            borderColor: "#9e9e9e",
            minHeight: "40px",
            height: "40px",
            boxShadow: state.isFocused ? null : null,
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

    const handleChange = (e) => {
        const projId = e.value;
        const projObj = researchProjects.find((proj) => proj.id === Number(projId));
        setSelectedProject(projObj);

        const option = options.find((option) => option.value === Number(projId));
        setSelectedOption(option);
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
                        data-cy="project-select"
                        data-testid="project-select"
                        name="project"
                        tabIndex="-1"
                        value={defaultOption ?? selectedOption}
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
    selectedResearchProject: PropTypes.object,
    setSelectedProject: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
};
