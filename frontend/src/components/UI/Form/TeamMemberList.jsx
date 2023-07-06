import icons from "../../../uswds/img/sprite.svg";

const TeamMemberList = ({ selectedTeamMembers, removeTeamMember }) => {
    const TeamTag = ({ teamMember }) => (
        <div
            className="font-12px height-205 radius-md bg-brand-primary-light display-flex flex-align-center"
            style={{ width: "fit-content", padding: "5px" }}
        >
            {teamMember.full_name}
            <svg
                className="height-2 width-2 text-primary-dark margin-left-05 hover: cursor-pointer usa-tooltip"
                onClick={() => removeTeamMember(teamMember)}
                id={`submit-for-approval-${teamMember.id}`}
            >
                <use xlinkHref={`${icons}#cancel`}></use>
            </svg>
        </div>
    );

    return selectedTeamMembers.length > 0 ? (
        <ul className="add-list-reset">
            {selectedTeamMembers?.map((teamMember) => (
                <li key={teamMember.id} className="margin-top-105">
                    <TeamTag teamMember={teamMember} />
                </li>
            ))}
        </ul>
    ) : (
        <p>No team members</p>
    );
};

export default TeamMemberList;
