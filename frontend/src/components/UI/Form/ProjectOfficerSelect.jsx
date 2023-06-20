import { useEffect, useState } from "react";
import { useGetUsersQuery } from "../../../api/opsAPI";

export const ProjectOfficerSelect = ({ selectedProjectOfficer, setSelectedProjectOfficer }) => {
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery();
    const [inputValue, setInputValue] = useState(selectedProjectOfficer?.full_name ?? "");

    useEffect(() => {
        setInputValue(selectedProjectOfficer?.full_name ?? "");
    }, [selectedProjectOfficer]);

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    const onChangeSelect = (userId = 0) => {
        if (userId === 0) {
            setSelectedProjectOfficer(null);
            return;
        }
        const selected = users[userId - 1];
        setSelectedProjectOfficer({ ...selected });
    };

    return (
        <fieldset className="usa-fieldset">
            <label
                className="usa-label margin-top-0"
                htmlFor="project-officer-select"
                id="project-officer-select-label"
            >
                Project Officer
            </label>
            <div className="usa-combo-box width-card-lg" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select "
                    id="project-officer-select"
                    name="project-officer-select"
                    aria-hidden="true"
                    tabIndex="-1"
                    value={selectedProjectOfficer?.id}
                    onChange={(e) => onChangeSelect(Number(e.target.value))}
                    required
                >
                    {users.map((user) => (
                        <option key={user?.id} value={user?.id}>
                            {user?.full_name || user?.email}
                        </option>
                    ))}
                </select>
                <input
                    id="project-officer-select-input"
                    aria-label="project-officer-select-input"
                    aria-owns="users--list"
                    aria-controls="users--list"
                    aria-autocomplete="list"
                    aria-describedby="users--assistiveHint"
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
                        onClick={() => {
                            setSelectedProjectOfficer(null);
                        }}
                    >
                        &nbsp;
                    </button>
                </span>
                <span className="usa-combo-box__input-button-separator">&nbsp;</span>
                <span className="usa-combo-box__toggle-list__wrapper" tabIndex="-1">
                    <button
                        id="project-officer-select-toggle-list"
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
                    id="users--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby="project-officer-select-label"
                    hidden
                >
                    {users?.map((user, index) => {
                        return (
                            <li
                                key={user?.id}
                                aria-setsize={users?.length}
                                aria-posinset={index + 1}
                                aria-selected="false"
                                id={`project-officer-dynamic-select--list--option-${index}`}
                                className="usa-combo-box__list-option"
                                tabIndex={index === 0 ? "0" : "-1"}
                                role="option"
                                data-value={user?.full_name || user?.email}
                            >
                                {user?.full_name || user?.email}
                            </li>
                        );
                    })}
                </ul>

                <div className="usa-combo-box__status usa-sr-only" role="status"></div>
                <span id="users--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </fieldset>
    );
};

export default ProjectOfficerSelect;
