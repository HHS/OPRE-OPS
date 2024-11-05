import cssClasses from "./styles.module.css";

/**
 * @component RoundedBox
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {string} [props.dataCy] - Data attribute for Cypress tests.
 * @param {Object} [props.rest] - Additional props to be passed
 * @returns {JSX.Element} Rendered component.
 */
const RoundedBox = ({ children, className, dataCy, ...rest }) => {
    const cardContainer = `bg-brand-base-light-variant border-base-light font-family-sans display-flex ${cssClasses.container} ${className ? className : ""}`;

    return (
        <div
            className={cardContainer}
            data-cy={dataCy}
            {...rest}
        >
            {children}
        </div>
    );
};

export default RoundedBox;
