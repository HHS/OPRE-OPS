import { useSelector } from "react-redux";

const TeamMemberList = () => {
    const agreement = useSelector((state) => state.createAgreement.agreement);
    const teamMembers = agreement?.team_members || [];

    return teamMembers.length > 0 ? (
        <ul>
            {teamMembers.map((teamMember) => (
                <li key={teamMember.id}>{teamMember.full_name}</li>
            ))}
        </ul>
    ) : (
        <p>No team members</p>
    );
};

export default TeamMemberList;
