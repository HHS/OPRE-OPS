import PropTypes from "prop-types";
const Tag = ({ tagStyle = "", text = "", active = false, label = "", className = "", children }) => {
    let tagClasses = "font-12px padding-05 height-205 radius-md",
        activeClass = "";
    // OVERRIDES FOR DEFAULT CLASSES
    if (tagStyle === "darkTextLightBackground") {
        tagClasses += " bg-brand-neutral-lightest text-brand-neutral-dark";
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses += " bg-brand-data-viz-primary-4 text-brand-neutral-lightest";
    } else if (tagStyle === "darkTextWhiteBackground") {
        tagClasses += " bg-white text-brand-neutral-dark";
    } else if (tagStyle === "darkTextGreenBackground") {
        tagClasses += " bg-brand-data-viz-primary-10 text-brand-neutral-dark";
    }
    // ACTIVE CLASSES FOR GRAPH LEGEND
    if (active && label === "Available") {
        activeClass += " bg-brand-data-viz-primary-5 text-white fake-bold";
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

    return (
        <span className={`${tagClasses} ${activeClass} ${className}`} style={{ width: "fit-content" }}>
            {text} {children}
        </span>
    );
};

export default Tag;

Tag.propTypes = {
    tagStyle: PropTypes.string,
    text: PropTypes.string,
    active: PropTypes.bool,
    label: PropTypes.string,
    className: PropTypes.string,
};
