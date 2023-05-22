import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";

const TeamMemberList = ({ selectedTeamMembers, setSelectedTeamMembers }) => {
    const handleChange = (teamMemberId) => {
        setSelectedTeamMembers((prevState) => {
            return prevState.filter((teamMember) => teamMember.id !== teamMemberId);
        });
    };

    const TeamTag = ({ teamMemberName, teamMemberId }) => (
        <span
            className="font-12px padding-05 height-205 radius-md bg-brand-primary-light display-flex flex-align-center"
            style={{ width: "fit-content" }}
        >
            {teamMemberName}
            <FontAwesomeIcon
                icon={faXmarkCircle}
                className="height-2 width-2 text-primary-dark margin-left-1 hover: cursor-pointer usa-tooltip"
                title="delete"
                data-position="top"
                onClick={() => handleChange(teamMemberId)}
            />
        </span>
    );

    TeamTag.propTypes = {
        teamMemberName: PropTypes.string.isRequired,
        teamMemberId: PropTypes.number.isRequired,
    };

    return selectedTeamMembers.length > 0 ? (
        <ul className="add-list-reset">
            {selectedTeamMembers.map((teamMember) => (
                <li key={teamMember.id} className="margin-top-105">
                    <TeamTag teamMemberId={teamMember.id} teamMemberName={teamMember.full_name} />
                </li>
            ))}
        </ul>
    ) : (
        <p>No team members</p>
    );
};

export default TeamMemberList;
