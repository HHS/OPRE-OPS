import icons from "../../uswds/img/sprite.svg";

/**
 * @component - Renders a list of team members.
 * @param {Object} props - The component props.
 * @param {import("../../types/UserTypes").SafeUser[]} props.selectedTeamMembers - The selected team members.
 * @param {(teamMember: import("../../types/UserTypes").SafeUser) => void} props.removeTeamMember - The function to remove a team member.
 * @returns {React.ReactElement} - The rendered component.
 */
const TeamMemberList = ({ selectedTeamMembers, removeTeamMember }) => {
    /**
     * @component - Renders a tag for a team member.
     * @param {Object} props - The component props.
     * @param {import("../../types/UserTypes").SafeUser} props.teamMember - The team member.
     * @returns {React.ReactElement} - The rendered component.
     */
    const TeamTag = ({ teamMember }) => (
        <div
            className="font-12px height-205 radius-md bg-brand-primary-light display-flex flex-align-center"
            style={{ width: "fit-content", padding: "5px" }}
        >
            {teamMember.full_name}
            <svg
                className="height-2 width-2 text-primary-dark margin-left-05 cursor-pointer"
                onClick={() => removeTeamMember(teamMember)}
                id={`submit-for-approval-${teamMember.id}`}
            >
                <use xlinkHref={`${icons}#cancel`}></use>
            </svg>
        </div>
    );

    return selectedTeamMembers?.length > 0 ? (
        <ul className="add-list-reset">
            {[...selectedTeamMembers]
                ?.sort((a, b) => a.full_name.localeCompare(b.full_name))
                ?.map((teamMember) => (
                    <li
                        key={teamMember.id}
                        className="margin-top-105"
                    >
                        <TeamTag teamMember={teamMember} />
                    </li>
                ))}
        </ul>
    ) : (
        <p>No team members</p>
    );
};

export default TeamMemberList;
