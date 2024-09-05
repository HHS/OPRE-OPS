import PropTypes from "prop-types";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import cssClasses from "./styles.module.css";

library.add(faSquare);

/**
 * RoundedBox component.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {string} [props.dataCy] - Data attribute for Cypress tests.
 * @returns {React.JSX.Element} Rendered component.
 */
const RoundedBox = ({ children, className, dataCy, ...rest }) => {
    const cardContainer = `bg-brand-base-light-variant border-base-light font-family-sans display-flex ${cssClasses.container} ${className}`;

    return (
        <div
            className={cardContainer}
            data-cy={dataCy ?? dataCy}
            {...rest}
        >
            {children}
        </div>
    );
};
RoundedBox.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    dataCy: PropTypes.string
};

export default RoundedBox;
