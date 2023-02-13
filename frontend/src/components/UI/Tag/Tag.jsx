import styles from "./styles.module.css";
import PropTypes from "prop-types";
const Tag = ({ tagStyle = "", text = "", active = false, label = "" }) => {
    let tagClasses = "",
        activeClass = "";

    if (tagStyle === "darkTextLightBackground") {
        tagClasses = `${styles.tag} bg-brand-neutral-lightest text-brand-neutral-dark font-12px padding-05`;
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses = `${styles.tag} bg-brand-dataviz-dark-blue text-brand-neutral-lightest font-12px padding-05`;
    }

    if (active && label === "Available") {
        activeClass = "bg-brand-dataviz-level-1 text-white fake-bold";
    } else if (active && label === "Planned") {
        activeClass = "bg-brand-dataviz-level-2 text-white fake-bold";
    } else if (active && label === "Executing") {
        activeClass = "bg-brand-dataviz-level-3 fake-bold";
    } else if (active && label === "Obligated") {
        activeClass = "bg-brand-dataviz-level-4 text-white fake-bold";
    } else if (active && label.includes("Funding Received")) {
        activeClass = "bg-brand-line-graph-level-7 text-white fake-bold";
    } else if (active && label.includes("Funding Expected")) {
        activeClass = "bg-brand-line-graph-level-2 fake-bold";
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
