import Hero from "../../UI/Hero";
import TeamLeaders from "../../UI/TeamLeaders/TeamLeaders";
import TermTag from "../../UI/Term/TermTag";
import { formatUserName } from "../../../helpers/users.helpers";
import HeroDescription from "./HeroDescription";

/**
 @typedef {Object} HeroProps
    @property {string} entityName
    @property {string} divisionName
    @property {import("../../../types/UserTypes").SafeUser} teamLeaders
    @property {import("../../../types/UserTypes").SafeUser | null} divisionDirector
    @property {import("../../../types/UserTypes").SafeUser | null} deputyDivisionDirector
    @property {string} label
    @property {string} description
    @property {string} url
    @property {React.ReactNode} [children]
*/
/**
 * @component PortfolioHero
 * @param {HeroProps} props
 * @returns {React.ReactElement}
 */
const PortfolioHero = ({
    entityName,
    description,
    divisionName,
    label,
    teamLeaders,
    divisionDirector,
    deputyDivisionDirector,
    url,
    children
}) => {
    return (
        <Hero entityName={entityName}>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-neg-05`}>{divisionName}</h2>
            <div className="display-flex flex-align-start">
                <div className="margin-right-4">
                    <TeamLeaders teamLeaders={teamLeaders} />
                </div>
                <dl className="margin-0 margin-right-4 font-12px">
                    <TermTag
                        term="Division Director"
                        description={formatUserName(divisionDirector?.display_name ?? divisionDirector?.full_name)}
                    />
                </dl>
                <dl className="margin-0 font-12px">
                    <TermTag
                        term="Deputy Division Director"
                        description={formatUserName(
                            deputyDivisionDirector?.display_name ?? deputyDivisionDirector?.full_name
                        )}
                    />
                </dl>
            </div>
            <HeroDescription
                label={label}
                description={description}
                url={url}
            />
            {children && children}
        </Hero>
    );
};

export default PortfolioHero;
