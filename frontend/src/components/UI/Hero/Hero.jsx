import TeamLeaders from "../../UI/TeamLeaders/TeamLeaders";
import HeroDescription from "../../UI/HeroDescription/HeroDescription";

/**
 @typedef {Object} HeroProps
    @property {string} entityName
    @property {string} divisionName
    @property {import("../../Users/UserTypes").SafeUser} teamLeaders
    @property {string} label
    @property {string} description
    @property {string[]} urls
    @property {React.ReactNode} [children]
*/
/**
 * @component Hero
 * @param {HeroProps} props
 * @returns {JSX.Element}
 */
const Hero = ({ entityName, children, description, divisionName, label, teamLeaders, urls }) => {
    return (
        <section className="bg-brand-base-light-variant border-base-light border-2px padding-4 radius-md ">
            <h1
                className={`font-sans-2xl margin-0 text-brand-primary`}
                style={{ maxWidth: "70%" }}
            >
                {entityName}
            </h1>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>{divisionName}</h2>
            <TeamLeaders teamLeaders={teamLeaders} />
            <HeroDescription
                label={label}
                description={description}
                urls={urls}
            />
            {children && children}
        </section>
    );
};

export default Hero;
