import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAgreementTeamMembers } from "./createAgreementSlice";

export const TeamMemberSelect = ({ className }) => {
    const dispatch = useDispatch();
    const usersList = useSelector((state) => state.createAgreement.users);

    const selectedTeamMembers = useSelector((state) => state.createAgreement.agreement?.team_members);
    const [inputValue, setInputValue] = useState(selectedTeamMembers?.full_name ?? "");

    useEffect(() => {
        setInputValue(selectedTeamMembers?.full_name ?? "");
    }, [selectedTeamMembers]);

    const onChangeSelect = (userId = 0) => {
        if (userId === 0) {
            return;
        }
        const selected = usersList[userId - 1];
        dispatch(setAgreementTeamMembers([...selectedTeamMembers, { ...selected }]));
    };

    return (
        <div className={`usa-fieldset ${className}`}>
            <label className="usa-label" htmlFor="project-officer-select" id="project-officer-select-label">
                Team Members
            </label>
            <div className="usa-combo-box width-card-lg" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select "
                    name="project-officer-select"
                    aria-hidden="true"
                    tabIndex="-1"
                    value={selectedTeamMembers?.id}
                    onChange={(e) => onChangeSelect(Number(e.target.value))}
                    required
                >
                    {usersList.map((user) => (
                        <option key={user?.id} value={user?.id}>
                            {user?.full_name || user?.email}
                        </option>
                    ))}
                </select>
                <input
                    id="project-officer-select"
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
                        onClick={() => onChangeSelect(0)}
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
                    id="users--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby="project-officer-select-label"
                    hidden
                >
                    {usersList?.map((user, index) => {
                        return (
                            <li
                                key={user?.id}
                                aria-setsize={usersList?.length}
                                aria-posinset={index + 1}
                                aria-selected="false"
                                id={`dynamic-select--list--option-${index}`}
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
        </div>
    );
};

export default TeamMemberSelect;
