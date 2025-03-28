import cx from "clsx";
import _ from "lodash";
import { useState } from "react";
import { useGetUsersQuery } from "../../api/opsAPI";
import ComboBox from "../UI/Form/ComboBox";

/**
 * @typedef {import("../Users/UserTypes").SafeUser} SafeUser
 */

/**
 * A component that renders a select input for choosing team members.
 * @component
 * @param {Object} props - The component props.
 * @param {string} [props.className] - The class name to apply to the component.
 * @param {SafeUser} props.selectedProjectOfficer - The currently selected project officer.
 * @param {SafeUser} props.selectedAlternateProjectOfficer - The currently selected alternate project officer.
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
    selectedAlternateProjectOfficer,
    selectedTeamMembers,
    setSelectedTeamMembers,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    messages = []
}) => {
    /** @type {{data?: SafeUser[] | undefined, error?: Object,  isLoading: boolean}} */
    const { data: users, error: errorUsers, isLoading: isLoadingUsers } = useGetUsersQuery({});
    const [selectedTeamMember, setSelectedTeamMember] = useState({});

    if (isLoadingUsers) {
        return <div>Loading...</div>;
    }
    if (errorUsers) {
        return <div>Oops, an error occurred</div>;
    }

    const remainingUsers = users?.filter(
        /**
         * @param {SafeUser} user
         */
        (user) =>
            user.id !== selectedProjectOfficer?.id && // Check if the user is not a selected project officer
            user.id !== selectedAlternateProjectOfficer?.id && // Check if the user is not a selected alternate project officer
            !selectedTeamMembers.some((teamMember) => teamMember.id === user.id) // Check if the user is not already a team member
    );

    /**
     * @param {SafeUser} user
     */
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
            {messages?.length > 0 && (
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

export default TeamMemberComboBox;
