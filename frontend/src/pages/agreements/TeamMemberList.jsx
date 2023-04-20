import { useSelector } from "react-redux";

const TeamMemberList = () => {
    const teamMembers = useSelector((state) => state.createAgreement.agreement?.team_members);

    return (
        <ul>
            {teamMembers.map((teamMember) => (
                <li key={teamMember.id}>{teamMember.full_name}</li>
            ))}
        </ul>
    );
};

export default TeamMemberList;
