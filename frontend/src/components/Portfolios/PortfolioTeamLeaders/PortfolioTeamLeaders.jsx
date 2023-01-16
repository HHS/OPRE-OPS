import { useSelector } from "react-redux";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

import cssClasses from "./styles.module.css";

const PortfolioTeamLeaders = () => {
    const portfolio = useSelector((state) => state.portfolio.portfolio);

    const LeaderName = (props) => (
        <span className={cssClasses.leader}>
            <FontAwesomeIcon icon={faCircleUser} className={cssClasses.icon} />
            <a href=".">{props.value}</a>
        </span>
    );

    if (portfolio.team_leaders) {
        return (
            <div id="PortfolioTeamLeaders" className={cssClasses.box}>
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
