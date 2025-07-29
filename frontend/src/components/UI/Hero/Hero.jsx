/**
 @typedef {Object} HeroProps
    @property {string} entityName
    @property {React.ReactNode} [children]
*/

/**
 * @component Hero
 * @param {HeroProps} props
 * @returns {React.ReactElement}
 */
const Hero = ({ entityName, children }) => {
    return (
        <section className="bg-brand-base-light-variant border-base-light border-2px padding-4 radius-md ">
            <h1
                className={`font-sans-2xl margin-0 text-brand-primary`}
                style={{ maxWidth: "70%" }}
            >
                {entityName}
            </h1>
            {children && children}
        </section>
    );
};

export default Hero;
