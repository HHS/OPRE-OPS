import { useDispatch, useSelector } from "react-redux";
import RoundedBox from "../../components/UI/RoundedBox/RoundedBox";
import { setResearchProjectsFilter, setSelectedProject } from "./createBudgetLineSlice";

export const ProjectSelect = () => {
    const dispatch = useDispatch();
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects);
    const selectedResearchProject = useSelector((state) => state.createBudgetLine.selected_project);
    const onChangeResearchProjectSelection = (projectId = 0) => {
        if (projectId === 0) {
            return;
        }

        dispatch(
            setSelectedProject({ id: researchProjects[projectId - 1].id, value: researchProjects[projectId - 1].title })
        );
        // event.preventDefault();
    };

    const onChangeResearchProjectFilter = (event) => {
        //console.log(`Input-Changed: ${event.target.value}`);
        dispatch(setResearchProjectsFilter({ value: event.target.value }));

        // let timeoutId;
        // console.log(`Filter-Change: ${event.target.value}`);
        // const inputValue = event.target.value;

        // window.cancelAnimationFrame(timeoutId);

        // timeoutId = window.requestAnimationFrame(() => {
        //     console.log("1 second has passed");
        //     dispatch(setResearchProjectsFilter({ value: inputValue }));
        // }, 1500);
        event.preventDefault();
    };
    const areThereTeamLeaders = researchProjects[selectedResearchProject?.id - 1]?.team_leaders?.length > 0;
    return (
        <div className="display-flex flex-justify padding-top-105">
            <div className="left-half width-full">
                <label className="usa-label margin-top-0" htmlFor="project">
                    Project
                </label>
                <div className="usa-combo-box" data-enhanced="true">
                    <select
                        className="usa-select usa-sr-only usa-combo-box__select"
                        name="project"
                        id=""
                        aria-hidden="true"
                        tabIndex="-1"
                        onChange={(e) => onChangeResearchProjectSelection(e.target.value || 0)}
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
                        // onChange={onChangeResearchProjectFilter}
                    />
                    <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                        <button
                            type="button"
                            className="usa-combo-box__clear-input"
                            aria-label="Clear the select contents"
                            onClick={() => dispatch(setSelectedProject({}))}
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
                                    aria-setsize={project?.length}
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
            <div className="right-half">
                {selectedResearchProject?.id && (
                    <div
                        className="bg-base-lightest font-family-sans border-1px border-base-light radius-sm margin-top-4"
                        style={{ width: "383px", minHeight: "121px" }}
                    >
                        <dl className="margin-0 padding-y-2 padding-x-105">
                            <dt className="margin-0 text-base-dark">Project</dt>
                            <dd className="text-semibold margin-0">{selectedResearchProject.value}</dd>
                            {areThereTeamLeaders && (
                                <dt className="margin-0 text-base-dark margin-top-2">Project Officer</dt>
                            )}
                            {researchProjects[selectedResearchProject.id - 1]?.team_leaders?.map((leader) => (
                                <dd key={leader?.id} className="text-semibold margin-0">
                                    {leader?.first_name} {leader?.last_name}
                                </dd>
                            ))}
                        </dl>
                    </div>
                )}
            </div>
        </div>
    );
};
