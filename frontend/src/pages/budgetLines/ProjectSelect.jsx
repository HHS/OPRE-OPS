import { useDispatch, useSelector } from "react-redux";
import { setResearchProjectsFilter, setSelectedProject } from "./createBudgetLineSlice";

export const ProjectSelect = () => {
    const dispatch = useDispatch();
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects);

    const onChangeResearchProjectSelection = (event) => {
        console.log(`Click-Event: ${event.target.value}`);
        dispatch(setSelectedProject({ id: event.target.id, value: event.target.value }));
        event.preventDefault();
    };

    const onChangeResearchProjectFilter = (event) => {
        console.log(`Filter-Change: ${event.target.value}`);
        dispatch(setResearchProjectsFilter({ value: event.target.value }));
        event.preventDefault();
    };

    // useEffect(() => {
    //     //dispatch(getResearchProjectByName(this.state.filterText));
    // }, [dispatch, researchProjects]);

    return (
        <>
            <label className="usa-label" htmlFor="project">
                Project
            </label>
            <div className="usa-combo-box" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select"
                    name="project"
                    id=""
                    aria-hidden="true"
                    tabIndex="-1"
                    onChange={onChangeResearchProjectSelection}
                >
                    {researchProjects.map((project) => {
                        return (
                            <option key={project?.id} value={project?.title}>
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
                    onChange={onChangeResearchProjectFilter}
                />
                <span className="usa-combo-box__clear-input__wrapper" tabIndex="-1">
                    <button type="button" className="usa-combo-box__clear-input" aria-label="Clear the select contents">
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
                    <li
                        aria-setsize="64"
                        aria-posinset="1"
                        aria-selected="false"
                        id="project--list--option-1"
                        className="usa-combo-box__list-option"
                        tabIndex="0"
                        role="option"
                        data-value="Red-X 2.0"
                    >
                        Red-X 2.0
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="2"
                        aria-selected="false"
                        id="project--list--option-2"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="red-x 3.0"
                    >
                        Red-x 3.0
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="3"
                        aria-selected="false"
                        id="project--list--option-3"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="white-x 1.0"
                    >
                        White-x 1.0
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="4"
                        aria-selected="false"
                        id="project--list--option-4"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="white-x 2.0"
                    >
                        White-x 2.0
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="5"
                        aria-selected="false"
                        id="project--list--option-5"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="blue-x 1.0"
                    >
                        Blue-x 1.0
                    </li>
                    <li
                        aria-setsize="64"
                        aria-posinset="6"
                        aria-selected="false"
                        id="project--list--option-6"
                        className="usa-combo-box__list-option"
                        tabIndex="-1"
                        role="option"
                        data-value="blue-x 2.0"
                    >
                        Blue-x 2.0
                    </li>
                </ul>
                <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                <span id="project--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </>
    );
};
