import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

import cssClasses from "./TeamLeaders.module.css";
import Tag from "../Tag";

const TeamLeaders = ({ teamLeaders }) => {
    const LeaderName = (props) => (
        <li className={`margin-0 padding-0 display-inline-block`}>
            <span className={`padding-right-205 display-flex flex-align-center`}>
                <FontAwesomeIcon
                    icon={faCircleUser}
                    className={`height-3 width-3 padding-right-1`}
                />
                <span>
                    <a href=".">{props.value}</a>
                </span>
            </span>
        </li>
    );

    if (teamLeaders) {
        return (
            <div
                id="PortfolioTeamLeaders"
                className={`height-3 margin-top-3 margin-bottom-1 display-flex flex-align-center`}
            >
                <dl className="margin-0 font-12px">
                    <dt className="text-base-dark margin-top-3">Team Members</dt>
                    {teamLeaders.length > 0 ? (
                        <>
                            {teamLeaders.map((member) => (
                                <dd
                                    key={member.id}
                                    className="margin-0 margin-top-1 margin-bottom-2"
                                >
                                    <Tag
                                        tagStyle="primaryDarkTextLightBackground"
                                        text={member.full_name}
                                    />
                                </dd>
                            ))}
                        </>
                    ) : (
                        <dd className="margin-0 margin-top-1 margin-bottom-2">
                            <Tag
                                tagStyle="primaryDarkTextLightBackground"
                                text={missingValueText}
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
