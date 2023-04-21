import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { removeAgreementTeamMember } from "./createAgreementSlice";

const TeamMemberList = () => {
    const dispatch = useDispatch();
    const agreement = useSelector((state) => state.createAgreement.agreement);
    const teamMembers = agreement?.team_members || [];

    const TeamTag = ({ teamMemberName, teamMemberId }) => (
        <span
            className="font-12px padding-05 height-205 radius-md bg-brand-primary-light"
            style={{ width: "fit-content" }}
        >
            {teamMemberName}
            <FontAwesomeIcon
                icon={faXmarkCircle}
                className="text-primary-dark margin-left-1 hover: cursor-pointer usa-tooltip"
                title="delete"
                data-position="top"
                onClick={() => dispatch(removeAgreementTeamMember(teamMemberId))}
            />
        </span>
    );

    return teamMembers.length > 0 ? (
        <ul className="add-list-reset">
            {teamMembers.map((teamMember) => (
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
