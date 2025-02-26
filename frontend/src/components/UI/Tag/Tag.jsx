/**
 * @typedef {Object} TagProps
 * @property {string} [tagStyle] - The style of the tag.
 * @property {string} [tagStyleActive] - The style of the tag when active.
 * @property {string} [text] - The text to display in the tag.
 * @property {boolean} [active] - Whether the tag is active or not.
 * @property {string} [label] - The label of the tag.
 * @property {string} [className] - Additional CSS classes.
 * @property {number} [dataTestId] - The data test id.
 * @property {Object} [rest] - Additional props.
 * @property {React.ReactNode} [children] - Child elements.
 */

/**
 * @component Tag component.
 * @param {TagProps} props - The props.
 * @returns {JSX.Element} - The tag element.
 */
const Tag = ({ tagStyle, tagStyleActive, text, active = false, label, className, children, ...rest }) => {
    let tagClasses = "font-12px height-205 radius-md text-center",
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
        case "budgetAvailable":
            tagClasses += " bg-brand-data-viz-budget-graph-1 text-white";
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
                case "darkTextOnLightBlue":
                    activeClass += " bg-brand-feedback-info fake-bold";
                    break;
                case "lightTextOnDarkBlue":
                    activeClass += " bg-brand-can-total-budget-2 text-white fake-bold";
                    break;
                case "portfolioCarryForward":
                    activeClass += " bg-brand-portfolio-carry-forward fake-bold";
                    break;
                case "portfolioNewFunding":
                    activeClass += " bg-brand-portfolio-new-funding text-white fake-bold";
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
                    activeClass += " bg-brand-data-viz-bl-by-status-2 text-white fake-bold";
                    break;
                case "Executing":
                    activeClass += " bg-brand-data-viz-bl-by-status-3 fake-bold";
                    break;
                case "Obligated":
                    activeClass += " bg-brand-data-viz-bl-by-status-4 text-white fake-bold";
                    break;
                case "Draft":
                    activeClass += " bg-brand-data-viz-bl-by-status-1 fake-bold";
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * @description Handles the styles for the tag.
     * @returns {Object} - The styles for the tag.
     */
    const handleLegendStyles = () => ({
        width: "fit-content", // Ensures the tag's width adapts to its content
        padding: ".25em .5em" // Adds some space inside the tag for better readability
    });

    return (
        <span
            className={`${tagClasses} ${activeClass} ${className}`}
            style={handleLegendStyles()}
            data-testid={rest.dataTestId}
        >
            {text ? text : children}
        </span>
    );
};

export default Tag;
