import { useSelector } from "react-redux";

import style from "./styles.module.css";
import TeamLeaders from "../../UI/TeamLeaders/TeamLeaders";
import HeroDescription from "../../UI/HeroDescription/HeroDescription";

const PortfolioHeader = () => {
    const portfolio = useSelector((state) => state.portfolio.portfolio);
    const divisionClasses = `font-sans-3xs ${style.division}`;

    return (
        <section className="padding-4 radius-md bg-brand-base-light-variant">
            <h1 className={`font-sans-2xl margin-0 text-brand-primary ${style.heading}`}>{portfolio.name}</h1>
            <h2 className={divisionClasses}>{portfolio.division?.name}</h2>
            <TeamLeaders teamLeaders={portfolio.team_leaders} />
            <HeroDescription
                description={portfolio.description}
                urls={portfolio.urls}
            />
        </section>
    );
};

export default PortfolioHeader;
