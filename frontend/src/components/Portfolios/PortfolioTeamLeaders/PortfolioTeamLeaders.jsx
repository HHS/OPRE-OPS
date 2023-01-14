import { useSelector } from "react-redux";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

import cssClasses from "./styles.module.css";

const PortfolioTeamLeaders = () => {
    const portfolio = useSelector((state) => state.portfolio.portfolio);

    const LeaderName = (props) => (
        <span className={`display-flex flex-align-center ${cssClasses.leader}`}>
            <FontAwesomeIcon icon={faCircleUser} className={cssClasses.icon} />
            <a href="." className="margin-left-1 text-primary">
                {props.value}
            </a>
        </span>
    );

    if (portfolio.team_leaders) {
        return (
            <div id="PortfolioTeamLeaders" className="display-flex flex-align-center">
                <span className={cssClasses.title}>Team Leaders </span>
                {portfolio.team_leaders.map((item) => (
                    <LeaderName
                        key={`${item.first_name} ${item.last_name}`}
                        value={`${item.first_name} ${item.last_name}`}
                    />
                ))}
            </div>
        );
    }
};

export default PortfolioTeamLeaders;
