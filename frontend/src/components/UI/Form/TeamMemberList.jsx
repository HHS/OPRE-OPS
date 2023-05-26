import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";

const TeamMemberList = ({ selectedTeamMembers, removeTeamMember }) => {
    const TeamTag = ({ teamMember }) => (
        <span
            className="font-12px padding-05 height-205 radius-md bg-brand-primary-light display-flex flex-align-center"
            style={{ width: "fit-content" }}
        >
            {teamMember.full_name}
            <FontAwesomeIcon
                icon={faXmarkCircle}
                className="height-2 width-2 text-primary-dark margin-left-1 hover: cursor-pointer usa-tooltip"
                title="delete"
                data-position="top"
                onClick={() => removeTeamMember(teamMember)}
            />
        </span>
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
