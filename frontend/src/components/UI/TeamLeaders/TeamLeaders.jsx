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
                {/*<h3 className={`font-sans-2xs padding-right-2`}>Team Leaders </h3>*/}
                {/*<ul className={`display-inline-block padding-0 ${cssClasses.leaderList}`}>*/}
                {/*    {teamLeaders.map((item) => (*/}
                {/*        <LeaderName*/}
                {/*            key={`${item.first_name} ${item.last_name}`}*/}
                {/*            value={`${item.first_name} ${item.last_name}`}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*</ul>*/}
            </div>
        );
    }
};

export default TeamLeaders;
