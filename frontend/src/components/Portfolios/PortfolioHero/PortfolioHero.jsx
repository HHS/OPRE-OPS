import Hero from "../../UI/Hero";
import TeamLeaders from "../../UI/TeamLeaders/TeamLeaders";
import HeroDescription from "./HeroDescription";

/**
 @typedef {Object} HeroProps
    @property {string} entityName
    @property {string} divisionName
    @property {import("../../../types/UserTypes").SafeUser} teamLeaders
    @property {string} label
    @property {string} description
    @property {string} url
*/
/**
 * @component PortfolioHero
 * @param {HeroProps} props
 * @returns {React.ReactElement}
 */
const PortfolioHero = ({ entityName, description, divisionName, label, teamLeaders, url }) => {
    return (
        <Hero entityName={entityName}>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>{divisionName}</h2>
            <TeamLeaders teamLeaders={teamLeaders} />
            <HeroDescription
                label={label}
                description={description}
                url={url}
            />
        </Hero>
    );
};

export default PortfolioHero;
