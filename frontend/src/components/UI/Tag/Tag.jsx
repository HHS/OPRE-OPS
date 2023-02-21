import styles from "./styles.module.css";
import PropTypes from "prop-types";
const Tag = ({ tagStyle = "", text = "", active = false, label = "", className = "" }) => {
    let tagClasses = "font-12px padding-05",
        activeClass = "fake-bold";

    if (tagStyle === "darkTextLightBackground") {
        tagClasses += ` ${styles.tag} bg-brand-neutral-lightest text-brand-neutral-dark`;
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses += ` ${styles.tag} bg-brand-data-viz-primary-4 text-brand-neutral-lightest`;
    } else if (tagStyle === "darkTextWhiteBackground") {
        tagClasses += ` ${styles.tag} bg-white text-brand-neutral-dark`;
    }

    if (active && label === "Available") {
        activeClass += " bg-brand-data-viz-primary-5 text-white";
    } else if (active && label === "Planned") {
        activeClass += " bg-brand-data-viz-primary-11 text-white fake-bold";
    } else if (active && label === "Executing") {
        activeClass += " bg-brand-data-viz-primary-8 fake-bold";
    } else if (active && label === "Obligated") {
        activeClass += " bg-brand-data-viz-primary-6 text-white fake-bold";
    } else if (active && label.includes("Funding Received")) {
        activeClass += " bg-brand-data-viz-primary-3 text-white fake-bold";
    } else if (active && (label.includes("Funding Expected") || label.includes("Remaining Budget"))) {
        activeClass += " bg-brand-neutral-lighter fake-bold";
    } else if (active && label.includes("Carry-Forward")) {
        activeClass += " bg-brand-data-viz-primary-10 fake-bold";
    } else if (active && label.includes("New Funding")) {
        activeClass += " bg-brand-data-viz-secondary-20 text-white fake-bold";
    } else if (active && label.includes("Total Spending")) {
        activeClass += " bg-brand-data-viz-secondary-26 text-white fake-bold";
    }

    return <span className={`${tagClasses} ${activeClass} ${className}`}>{text}</span>;
};

export default Tag;

Tag.propTypes = {
    tagStyle: PropTypes.string,
    text: PropTypes.string,
    active: PropTypes.bool,
    label: PropTypes.string,
    className: PropTypes.string,
};
