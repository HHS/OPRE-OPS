import React from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { setAgreementProject, setSelectedProject } from "../../../../pages/agreements/createAgreementSlice";

export const ProjectSelect = ({
    researchProjects,
    selectedResearchProject,
    propsSelectedProject,
    clearFunction = () => {},
}) => {
    const dispatch = useDispatch();
    const [inputValue, setInputValue] = React.useState(selectedResearchProject?.title ?? "");

    React.useEffect(() => {
        setInputValue(selectedResearchProject?.title ?? "");
    }, [selectedResearchProject]);

    const onChangeResearchProjectSelection = (projectId = 0) => {
        console.log(`projectId: ${projectId}`);
        if (projectId === 0) {
            clearFunction();
            return;
        }
        // NOTE: if props SelectedProject is passed in, use that, otherwise use dispatch from Agreements slice
        if (propsSelectedProject) {
            propsSelectedProject(researchProjects[projectId - 1]);
        } else {
            dispatch(setSelectedProject(researchProjects[projectId - 1]));
        }

        dispatch(setAgreementProject(projectId));
    };
    const onInputCloseButtonClick = () => {
        if (propsSelectedProject) {
            propsSelectedProject({});
        } else {
            dispatch(setSelectedProject({}));
        }
        clearFunction();
    };

    const ProjectSummaryCard = ({ selectedResearchProject }) => {
        const { title, description } = selectedResearchProject;
        return (
            <div
                className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
                style={{ width: "23.9375rem", minHeight: "7.5625rem" }}
                data-cy="project-summary-card"
            >
                <dl className="margin-0 padding-y-2 padding-x-105">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="text-semibold margin-0">{title}</dd>
                    {description && <dt className="margin-0 text-base-dark margin-top-205">Project Description</dt>}
                    <dd className="text-semibold margin-0" style={{ maxWidth: "15.625rem" }}>
                        {description}
                    </dd>
                </dl>
            </div>
        );
    };
    ProjectSummaryCard.propTypes = {
        selectedResearchProject: PropTypes.shape({
            title: PropTypes.string.isRequired,
            description: PropTypes.string,
        }).isRequired,
    };
    return (
        <div className="display-flex flex-justify padding-top-105">
            {/* NOTE: Left side */}
            <div className="left-half width-full">
                <label className="usa-label margin-top-0" htmlFor="project" id="project-label">
                    Project
                </label>
                <div className="usa-combo-box" data-enhanced="true">
                    <select
                        className="usa-select usa-sr-only usa-combo-box__select"
                        data-cy="project-select"
                        name="project"
                        aria-hidden="true"
                        tabIndex="-1"
                        defaultValue={selectedResearchProject?.title}
                        onChange={(e) => onChangeResearchProjectSelection(Number(e.target.value) || 0)}
                    >
                        {researchProjects.map((project) => {
                            return (
                                <option key={project?.id} value={project?.id}>
                                    {project?.title}
                                </option>
                            );
                        })}
                    </select>
                    <input
                        id="project"
                        aria-owns="project--list"
                        aria-controls="project--list"
                        aria-autocomplete="list"
                        aria-describedby="project--assistiveHint"
                        aria-expanded="false"
                        autoCapitalize="off"
                        autoComplete="off"
                        className="usa-combo-box__input"
                        type="text"
                        role="combobox"
                        aria-activedescendant=""
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                        <button
                            type="button"
                            className="usa-combo-box__clear-input"
                            aria-label="Clear the select contents"
                            onClick={() => onInputCloseButtonClick()}
                        >
                            &nbsp;
                        </button>
                    </span>
                    <span className="usa-combo-box__input-button-separator">&nbsp;</span>
                    <span className="usa-combo-box__toggle-list__wrapper" tabIndex="-1">
                        <button
                            id={`project--list--toggle`}
                            type="button"
                            tabIndex="-1"
                            className="usa-combo-box__toggle-list"
                            aria-label="Toggle the dropdown list"
                        >
                            &nbsp;
                        </button>
                    </span>
                    <ul
                        tabIndex="-1"
                        id="project--list"
                        className="usa-combo-box__list"
                        role="listbox"
                        aria-labelledby="project-label"
                        hidden
                    >
                        {researchProjects?.map((project, index) => {
                            return (
                                <li
                                    key={project?.id}
                                    aria-setsize={researchProjects?.length}
                                    aria-posinset={index + 1}
                                    aria-selected="false"
                                    id={`dynamic-select--list--option-${index}`}
                                    className="usa-combo-box__list-option"
                                    tabIndex={index === 0 ? "0" : "-1"}
                                    role="option"
                                    data-value={project?.title}
                                >
                                    {project?.title}
                                </li>
                            );
                        })}
                    </ul>
                    <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                    <span id="project--assistiveHint" className="usa-sr-only">
                        When autocomplete results are available use up and down arrows to review and enter to select.
                        Touch device users, explore by touch or with swipe gestures.
                    </span>
                </div>
            </div>
            {/* NOTE: Right side */}
            <div className="right-half">
                {selectedResearchProject?.id && (
                    <ProjectSummaryCard selectedResearchProject={selectedResearchProject} />
                )}
            </div>
        </div>
    );
};

export default ProjectSelect;

ProjectSelect.propTypes = {
    researchProjects: PropTypes.array.isRequired,
    selectedResearchProject: PropTypes.object.isRequired,
    setSelectedProject: PropTypes.func,
    clearFunction: PropTypes.func,
};
