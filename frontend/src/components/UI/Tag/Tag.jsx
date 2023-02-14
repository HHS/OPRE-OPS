import styles from "./styles.module.css";
import PropTypes from "prop-types";
const Tag = ({ tagStyle = "", text = "", active = false, label = "" }) => {
    let tagClasses = "",
        activeClass = "";

    if (tagStyle === "darkTextLightBackground") {
        tagClasses = `${styles.tag} bg-brand-neutral-lightest text-brand-neutral-dark font-12px padding-05`;
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses = `${styles.tag} bg-brand-dataviz-primary-4 text-brand-neutral-lightest font-12px padding-05`;
    }

    if (active && label === "Available") {
        activeClass = "bg-brand-data-viz-primary-5 text-white fake-bold";
    } else if (active && label === "Planned") {
        activeClass = "bg-brand-data-viz-primary-11 text-white fake-bold";
    } else if (active && label === "Executing") {
        activeClass = "bg-brand-data-viz-primary-8 fake-bold";
    } else if (active && label === "Obligated") {
        activeClass = "bg-brand-data-viz-primary-6 text-white fake-bold";
    } else if (active && label.includes("Funding Received")) {
        activeClass = "bg-brand-data-viz-primary-3 text-white fake-bold";
    } else if (active && label.includes("Funding Expected")) {
        activeClass = "bg-brand-neutral-lighter text-white fake-bold";
    }

    return <span className={`${tagClasses} ${activeClass}`}>{text}</span>;
};

export default Tag;

Tag.propTypes = {
    tagStyle: PropTypes.string,
    text: PropTypes.string,
    active: PropTypes.bool,
    label: PropTypes.string,
};
