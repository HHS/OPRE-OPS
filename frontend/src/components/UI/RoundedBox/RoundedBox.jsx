import cssClasses from "./styles.module.css";

/**
 * @component RoundedBox
 * The root carries `ops-card`, a marker class (no styles of its own) that opts card copy out of the
 * global 24px paragraph leading — see OPS-6026 in sass/uswds/_uswds-theme-custom-styles.scss.
 * Add `ops-card` to the root of any new card that doesn't use RoundedBox.
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
    const cardContainer = `ops-card bg-brand-base-light-variant border-base-light font-family-sans ${cssClasses.container} ${className ? className : ""}`;

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
