import TeamLeaders from "../../UI/TeamLeaders/TeamLeaders";
import HeroDescription from "../../UI/HeroDescription/HeroDescription";
/**
 *
 * @component Hero
 * @param {Object} props
 * @returns {JSX.Element}
 */
const Hero = (props) => {
    return (
        <section className="bg-brand-base-light-variant border-base-light border-2px padding-4 radius-md ">
            <h1
                className={`font-sans-2xl margin-0 text-brand-primary`}
                style={{ maxWidth: "70%" }}
            >
                {props.entityName}
            </h1>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>{props.divisionName}</h2>
            <TeamLeaders teamLeaders={props.teamLeaders} />
            <HeroDescription
                label={props.label}
                description={props.description}
                urls={props.urls}
            />
            {props.children}
        </section>
    );
};

export default Hero;
