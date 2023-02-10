import styles from "./styles.module.css";
import PropTypes from "prop-types";
const Tag = ({ tagStyle, text, active = false, label }) => {
    let tagClasses;
    let activeStyle = "";

    if (tagStyle === "darkTextLightBackground") {
        tagClasses = `${styles.tag} bg-brand-neutral-lightest text-brand-neutral-dark font-12px padding-05`;
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses = `${styles.tag} bg-brand-dataviz-dark-blue text-brand-neutral-lightest font-12px padding-05`;
    }

    if (active && label === "Available") {
        activeStyle = "bg-brand-dataviz-level-1 text-white text-bold";
    }
    if (active && label === "Planned") {
        activeStyle = "bg-brand-dataviz-level-2 text-white text-bold";
    }
    if (active && label === "Executing") {
        activeStyle = "bg-brand-dataviz-level-3 text-bold";
    }
    if (active && label === "Obligated") {
        activeStyle = "bg-brand-dataviz-level-4 text-white text-bold";
    }

    return <span className={`${tagClasses} ${activeStyle}`}>{text}</span>;
};

export default Tag;

Tag.propTypes = {
    tagStyle: PropTypes.string,
    text: PropTypes.string,
    active: PropTypes.bool,
    label: PropTypes.string,
};
