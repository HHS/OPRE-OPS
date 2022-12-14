import { useSelector } from "react-redux";

const PortfolioTeamLeaders = () => {
    const portfolio = useSelector((state) => state.portfolioDetail.portfolio);

    const LeaderName = (props) => <span>{props.value}</span>

    return (
        <div>
            <strong>Team leaders</strong>
            {portfolio.team_leaders.map(item => <LeaderName key={item.first_name} value={item.first_name} />)}
        </div>
    );
};

export default PortfolioTeamLeaders;
