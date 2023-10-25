import Tag from "../Tag";

const TeamLeaders = ({ teamLeaders }) => {
    if (teamLeaders) {
        return (
            <div id="PortfolioTeamLeaders">
                <dl className="margin-0 font-12px">
                    <dt className="text-base-dark margin-top-3">Team Leader</dt>
                    {teamLeaders.length > 0 ? (
                        <>
                            {teamLeaders.map((leader) => (
                                <dd
                                    key={leader.id}
                                    className="margin-0 margin-top-1 margin-bottom-2"
                                >
                                    <Tag
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={leader.full_name}
                                    />
                                </dd>
                            ))}
                        </>
                    ) : (
                        <dd className="margin-0 margin-top-1 margin-bottom-2">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text="TBD"
                            />
                        </dd>
                    )}
                </dl>
            </div>
        );
    }
};

export default TeamLeaders;
