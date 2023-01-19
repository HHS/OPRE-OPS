import { useSelector } from "react-redux";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

import cssClasses from "./styles.module.css";

const PortfolioTeamLeaders = () => {
    const portfolio = useSelector((state) => state.portfolio.portfolio);

    const LeaderName = (props) => (
        <li className="display-flex flex-align-center margin-left-1">
            <FontAwesomeIcon icon={faCircleUser} className={`height-3 width-3`} />
            <a className="margin-left-1 text-primary" href=".">
                {props.value}
            </a>
        </li>
    );

    if (portfolio.team_leaders) {
        return (
            <div
                id="PortfolioTeamLeaders"
                className={`height-3 margin-top-3 margin-bottom-1 display-flex flex-align-center`}
            >
                <h3 className="font-sans-2xs">Team Leaders</h3>
                <ul className={`display-flex padding-0 ${cssClasses.leaderList}`}>
                    {portfolio.team_leaders.map((item) => (
                        <LeaderName
                            key={`${item.first_name} ${item.last_name}`}
                            value={`${item.first_name} ${item.last_name}`}
                        />
                    ))}
                </ul>
            </div>
        );
    }
};

export default PortfolioTeamLeaders;
