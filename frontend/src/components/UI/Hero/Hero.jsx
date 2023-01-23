import TeamLeaders from "../../UI/TeamLeaders/TeamLeaders";
import HeroDescription from "../../UI/HeroDescription/HeroDescription";

const Hero = (props) => {
    return (
        <section className={`${props.backgroundColor && "padding-4"} radius-md ${props.backgroundColor}`}>
            <h1 className={`font-sans-2xl margin-0 text-brand-primary style={backgroundColor && { maxWidth: "70%" }`}>
                {props.entityName}
            </h1>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>{props.divisionName}</h2>
            <TeamLeaders teamLeaders={props.teamLeaders} />
            <HeroDescription description={props.description} urls={props.urls} />
            {props.children}
        </section>
    );
};

export default Hero;
