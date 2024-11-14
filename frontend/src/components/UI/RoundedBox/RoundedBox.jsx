import cssClasses from "./styles.module.css";

/**
 * @component RoundedBox
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {string} [props.id] - Element ID.
 * @param {string} [props.dataCy] - Data attribute for Cypress tests.
 * @param {Object} [props.style] - Inline styles.
 * @property {React.HTMLAttributes<HTMLDivElement>} [rest] - Additional props to be spread onto
 * @returns {JSX.Element} Rendered component.
 */
const RoundedBox = ({ children, className, dataCy, ...rest }) => {
    const cardContainer = `bg-brand-base-light-variant border-base-light font-family-sans ${cssClasses.container} ${className ? className : ""}`;

    return (
        <div
            className={cardContainer}
            data-cy={dataCy}
            {...rest}
            style={{ padding: "20px 30px", ...rest.style }}
        >
            {children}
        </div>
    );
};

export default RoundedBox;
