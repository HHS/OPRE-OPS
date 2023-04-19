import { useDispatch, useSelector } from "react-redux";
import { setAgreements, setSelectedAgreement, setSelectedProject } from "./createBudgetLineSlice";

export const ProjectSelect = () => {
    const dispatch = useDispatch();
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects_list);
    const selectedResearchProject = useSelector((state) => state.createBudgetLine.selected_project);
    const onChangeResearchProjectSelection = (projectId = 0) => {
        if (projectId === 0) {
            clearAgreementState();
            return;
        }
        dispatch(
            setSelectedProject({
                id: researchProjects[projectId - 1].id,
                title: researchProjects[projectId - 1].title,
                teamLeaders: researchProjects[projectId - 1].team_leaders,
            })
        );
    };

    const onInputCloseButtonClick = (event) => {
        dispatch(setSelectedProject({}));
        clearAgreementState();
    };

    const clearAgreementState = () => {
        dispatch(setAgreements([]));
        dispatch(setSelectedAgreement(-1));
    };

    const areThereTeamLeaders = selectedResearchProject?.teamLeaders?.length > 0;

    const ProjectSummaryCard = () => {
        return (
            <div
                className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
                style={{ width: "23.9375rem", minHeight: "7.5625rem" }}
            >
                <dl className="margin-0 padding-y-2 padding-x-105">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="text-semibold margin-0">{selectedResearchProject.title}</dd>
                    {areThereTeamLeaders && <dt className="margin-0 text-base-dark margin-top-205">Project Officer</dt>}
                    {selectedResearchProject?.teamLeaders?.map((leader) => (
                        <dd key={leader?.id} className="text-semibold margin-0">
                            {leader?.first_name} {leader?.last_name}
                        </dd>
                    ))}
                </dl>
            </div>
        );
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
                        defaultValue={selectedResearchProject?.title}
                    />
                    <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                        <button
                            type="button"
                            className="usa-combo-box__clear-input"
                            aria-label="Clear the select contents"
                            onClick={(e) => onInputCloseButtonClick(e)}
                        >
                            &nbsp;
                        </button>
                    </span>
                    <span className="usa-combo-box__input-button-separator">&nbsp;</span>
                    <span className="usa-combo-box__toggle-list__wrapper" tabIndex="-1">
                        <button
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
            <div className="right-half">{selectedResearchProject?.id && <ProjectSummaryCard />}</div>
        </div>
    );
};
