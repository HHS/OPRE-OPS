import cx from "clsx";
import _ from "lodash";
import PropTypes from "prop-types";
import { useState } from "react";
import { useGetUsersQuery } from "../../api/opsAPI";
import ComboBox from "../UI/Form/ComboBox";

/**
 * A component that renders a select input for choosing team members.
 * @component
 * @param {Object} props - The component props.
 * @param {string} [props.className] - The class name to apply to the component.
 * @param {Object} props.selectedProjectOfficer - The currently selected project officer.
 * @param {Object[]} props.selectedTeamMembers - The currently selected team members.
 * @param {Function} props.setSelectedTeamMembers - A function to set the selected team members.
 * @param {string} [props.legendClassname] - The class name to apply to the label/legend.
 * @param {string} [props.defaultString] - The default string to display in the select input.
 * @param {Object} [props.overrideStyles] - The styles to apply to the component.
 * @param {Object[]} [props.messages] - An array of error messages to display.
 * @returns {JSX.Element} - The rendered component.
 */
export const TeamMemberComboBox = ({
    className,
    selectedProjectOfficer,
    selectedTeamMembers,
    setSelectedTeamMembers,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    messages = []
}) => {
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery();
    const [selectedTeamMember, setSelectedTeamMember] = useState({});

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    const remainingUsers = users.filter(
        (user) =>
            user.id !== selectedProjectOfficer?.id && // Check if the user is not a selected project officer
            !selectedTeamMembers.some((teamMember) => teamMember.id === user.id) // Check if the user is not already a team member
    );

    const handleChange = (user) => {
        setSelectedTeamMember(user);
        if (!_.isEmpty(user)) {
            setSelectedTeamMembers(user);
        }
    };

    return (
        <div className={cx("usa-form-group margin-top-0", messages.length && "usa-form-group--error", className)}>
            <label
                className={legendClassname}
                htmlFor="team-member-combobox-input"
                id="team-member-label"
            >
                Team Members
            </label>
            {messages?.length && (
                <span
                    className="usa-error-message"
                    id="project-officer-combobox-input-error-message"
                    role="alert"
                >
                    {messages[0]}
                </span>
            )}
            <div>
                <ComboBox
                    namespace="team-member-combobox"
                    data={remainingUsers}
                    selectedData={selectedTeamMember}
                    setSelectedData={handleChange}
                    defaultString={defaultString}
                    optionText={(user) => user.full_name || user.email}
                    overrideStyles={overrideStyles}
                    clearWhenSet={true}
                    messages={messages}
                />
            </div>
        </div>
    );
};

TeamMemberComboBox.propTypes = {
    className: PropTypes.string,
    selectedProjectOfficer: PropTypes.object,
    selectedTeamMembers: PropTypes.array,
    setSelectedTeamMembers: PropTypes.func,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object,
    messages: PropTypes.array
};

export default TeamMemberComboBox;
