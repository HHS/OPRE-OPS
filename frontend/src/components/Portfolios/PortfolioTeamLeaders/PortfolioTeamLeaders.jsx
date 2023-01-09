import { useSelector } from "react-redux";

const PortfolioTeamLeaders = () => {
    const portfolio = useSelector((state) => state.portfolio.portfolio);

    const LeaderName = (props) => <span>{props.value}</span>;

    if(portfolio.team_leaders) {
        return (
            <div id="PortfolioTeamLeaders">
                <strong>Team leaders: </strong>
                {portfolio.team_leaders.map((item, index) => (
                    <LeaderName key={(`${item.first_name} ${item.last_name}`, index)} value={(index ? ", " : "") + `${item.first_name} ${item.last_name}`} />
                ))}
            </div>
        );
    }
};

export default PortfolioTeamLeaders;
