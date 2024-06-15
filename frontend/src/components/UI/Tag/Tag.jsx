import PropTypes from "prop-types";

/**
 * Tag component.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.tagStyle] -  The style of the tag.
 * @param {string} [props.tagStyleActive] -  The style of the tag when active.
 * @param {string} [props.text] -  The text to display in the tag.
 * @param {boolean} [props.active] -  Whether the tag is active or not.
 * @param {string} [props.label ] -   The label of the tag.
 * @param {string} [props.className] -  Additional CSS classes.
 * @param {React.ReactNode} [props.children] -  Child elements.
 * @returns {JSX.Element} - The tag element.
 */
const Tag = ({ tagStyle, tagStyleActive, text, active = false, label, className, children }) => {
    let tagClasses = "font-12px padding-y-05 padding-x-1 height-205 radius-md",
        activeClass = "";
    // OVERRIDES FOR DEFAULT CLASSES
    // Can also pass in className prop to override
    switch (tagStyle) {
        case "darkTextLightBackground":
            tagClasses += " bg-brand-neutral-lightest text-brand-neutral-dark";
            break;
        case "lightTextDarkBackground":
            tagClasses += " bg-brand-data-viz-primary-4 text-brand-neutral-lightest";
            break;
        case "darkTextWhiteBackground":
            tagClasses += " bg-white text-brand-neutral-dark";
            break;
        case "darkTextGreenBackground":
            tagClasses += " bg-brand-data-viz-primary-10 text-brand-neutral-dark";
            break;
        case "lightTextGreenBackground":
            tagClasses += " bg-brand-data-viz-secondary-58 text-brand-neutral-lightest";
            break;
        case "primaryDarkTextLightBackground":
            tagClasses += " bg-brand-primary-light text-brand-primary-dark";
            break;
        case "lightTextRedBackground":
            tagClasses += " bg-secondary-dark text-white";
            break;
        default:
            break;
    }
    // ACTIVE CLASSES FOR GRAPH LEGEND
    if (active) {
        if (tagStyleActive) {
            switch (tagStyleActive) {
                case "lightTextGreenBackground":
                    activeClass += " bg-brand-data-viz-secondary-58 text-white fake-bold";
                    break;
                case "darkTextGreyBackground":
                    activeClass += " bg-brand-neutral-lighter fake-bold";
                    break;
                case "lightTextRedBackground":
                    activeClass += " bg-secondary-dark text-white fake-bold";
                    break;
                case "whiteOnPurple":
                    activeClass += " bg-brand-data-viz-secondary-20 text-white fake-bold";
                    break;
                case "whiteOnTeal":
                    activeClass += " bg-brand-data-viz-primary-10 fake-bold";
                    break;
                case "whiteOnOrange":
                    activeClass += " bg-brand-data-viz-primary-3 text-white fake-bold";
                    break;
                case "whiteOnPink":
                    activeClass += " bg-brand-data-viz-secondary-26 text-white fake-bold";
                    break;
                default:
                    break;
            }
        } else {
            switch (label) {
                case "Available":
                    activeClass += " bg-brand-data-viz-primary-5 text-white fake-bold";
                    break;
                case "Planned":
                    activeClass += " bg-brand-data-viz-primary-11 text-white fake-bold";
                    break;
                case "Executing":
                    activeClass += " bg-brand-data-viz-primary-8 fake-bold";
                    break;
                case "Obligated":
                    activeClass += " bg-brand-data-viz-primary-6 text-white fake-bold";
                    break;
                case "Draft":
                    activeClass += " bg-brand-neutral-lighter fake-bold";
                    break;
                default:
                    break;
            }
        }
    }

    return (
        <span
            className={`${tagClasses} ${activeClass} ${className}`}
            style={{ width: "fit-content" }}
        >
            {text ? text : children}
        </span>
    );
};

Tag.propTypes = {
    tagStyle: PropTypes.string,
    text: PropTypes.string,
    active: PropTypes.bool,
    label: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
    tagStyleActive: PropTypes.string
};

export default Tag;
