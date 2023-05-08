import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAgreementTeamMembers } from "./createAgreementSlice";
import PropTypes from "prop-types";

export const TeamMemberSelect = ({ className }) => {
    const dispatch = useDispatch();
    const usersList = useSelector((state) => state.createAgreement.users);
    const selectedProjectOfficer = useSelector((state) => state.createAgreement.agreement?.project_officer);
    const selectedTeamMembers = useSelector((state) => state.createAgreement.agreement?.team_members);
    const remainingUsers = usersList.filter(
        (user) =>
            user.id !== selectedProjectOfficer?.id && // Check if the user is not a selected project officer
            !selectedTeamMembers.some((teamMember) => teamMember.id === user.id) // Check if the user is not already a team member
    );

    const [inputValue, setInputValue] = useState("");

    const onChangeSelect = (userId = 0) => {
        if (userId === 0) {
            return;
        }
        const selected = usersList.find((user) => user.id === userId);
        dispatch(setAgreementTeamMembers([...selectedTeamMembers, selected]));
        setInputValue("");
    };

    return (
        <div className={`usa-fieldset ${className}`}>
            <label className="usa-label margin-top-0" htmlFor="team-member-select" id="team-member-select-label">
                Team Members
            </label>
            <div className="usa-combo-box width-card-lg" data-enhanced="true">
                <select
                    className="usa-select usa-sr-only usa-combo-box__select "
                    name="team-member-select"
                    aria-hidden="true"
                    tabIndex="-1"
                    value={remainingUsers?.id}
                    onChange={(e) => onChangeSelect(Number(e.target.value))}
                    required
                >
                    {remainingUsers?.map((user) => (
                        <option key={user?.id} value={user?.id}>
                            {user?.full_name || user?.email}
                        </option>
                    ))}
                </select>
                <input
                    id="team-member-select"
                    aria-owns="team-members--list"
                    aria-controls="team-members--list"
                    aria-autocomplete="list"
                    aria-describedby="team-members--assistiveHint"
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
                        id="team-member-select-toggle-list"
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
                    id="team-members--list"
                    className="usa-combo-box__list"
                    role="listbox"
                    aria-labelledby="team-member-select-label"
                    hidden
                >
                    {usersList?.map((user, index) => {
                        return (
                            <li
                                key={user?.id}
                                aria-setsize={remainingUsers?.length}
                                aria-posinset={index + 1}
                                aria-selected="false"
                                id={`team-member-dynamic-select--list--option-${index}`}
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
                <span id="team-members--assistiveHint" className="usa-sr-only">
                    When autocomplete results are available use up and down arrows to review and enter to select. Touch
                    device users, explore by touch or with swipe gestures.
                </span>
            </div>
        </div>
    );
};

export default TeamMemberSelect;

TeamMemberSelect.propTypes = {
    className: PropTypes.string,
};
