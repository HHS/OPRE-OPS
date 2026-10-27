import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import icons from "../../../uswds/img/sprite.svg";
import Tooltip from "../../UI/USWDS/Tooltip";

/**
 * Shrinks a wrapped tooltip to hug its longest line. CSS can balance the line lengths,
 * but a wrapped box stays at its max width, which leaves empty space on the right.
 * @param {Element | null} tooltipBody - The USWDS .usa-tooltip__body element.
 */
const fitTooltipToText = (tooltipBody) => {
    if (!tooltipBody) return;
    tooltipBody.style.width = "";
    const range = document.createRange();
    range.selectNodeContents(tooltipBody);
    const lines = [...range.getClientRects()];
    if (lines.length === 0) return;
    const textWidth = Math.max(...lines.map((r) => r.right)) - Math.min(...lines.map((r) => r.left));
    const { paddingLeft, paddingRight } = getComputedStyle(tooltipBody);
    const padding = (parseFloat(paddingLeft) || 0) + (parseFloat(paddingRight) || 0);
    tooltipBody.style.width = `${Math.ceil(textWidth + padding)}px`;
};

const handleShowTitleTooltip = (event) => {
    const wrapper = event.currentTarget;
    requestAnimationFrame(() => fitTooltipToText(wrapper.querySelector(".usa-tooltip__body")));
};

/**
 * The TablePageLayout component is a layout component that displays a title and subtitle
 *
 * @component
 * @param {object} props - The component props.
 * @param {string} [props.buttonLink] - The link to navigate to when the button is clicked.
 * @param {string} [props.buttonText] - The text to display on the button.
 * @param {React.ReactNode} [props.children] - The children to render - optional.
 * @param {string} props.details - The details to display.
 * @param {React.ReactNode} [props.FilterButton] - The filter button to display.
 * @param {React.ReactNode} [props.FilterTags] - The filter tags to display.
 * @param {React.ReactNode} [props.FYSelect] - The fiscal year select to display.
 * @param {string} props.subtitle - The subtitle to display.
 * @param {React.ReactNode} [props.SummaryCardsSection] - The summary cards to display.
 * @param {React.ReactNode} [props.TableSection] - The table to display.
 * @param {React.ReactNode} props.TabsSection - The tabs to display.
 * @param {string} props.title - The title to display.
 * @param {string} [props.titleTooltip] - Definition shown in a tooltip from an info icon next to the title - optional.
 * @returns {JSX.Element} - The rendered component.
 */
export const TablePageLayout = ({
    buttonLink,
    buttonText,
    children,
    details,
    FilterButton = null,
    FilterTags = null,
    FYSelect,
    subtitle,
    SummaryCardsSection,
    TableSection = null,
    TabsSection,
    title,
    titleTooltip
}) => {
    return (
        <>
            <div className="display-flex flex-align-center flex-justify margin-bottom-205">
                <div className="display-flex flex-align-start">
                    <h1 className="margin-0 text-brand-primary font-sans-2xl">{title}</h1>
                    {titleTooltip && (
                        <span
                            className="display-flex"
                            onMouseOver={handleShowTitleTooltip}
                            onFocus={handleShowTitleTooltip}
                        >
                            <Tooltip
                                label={titleTooltip}
                                position="right"
                                className="title-info-tooltip display-flex margin-left-05"
                            >
                                {/* Button stays 24x24px to meet the WCAG 2.2 minimum target size; the icon inside is 20px */}
                                <button
                                    type="button"
                                    className="usa-button usa-button--unstyled display-flex flex-align-center flex-justify-center height-3 width-3"
                                    aria-label={`About ${title}`}
                                    data-cy="title-info-icon"
                                >
                                    <svg
                                        className="usa-icon height-205 width-205 text-brand-primary"
                                        aria-hidden="true"
                                        focusable="false"
                                        role="img"
                                    >
                                        <use href={`${icons}#info_outline`}></use>
                                    </svg>
                                </button>
                            </Tooltip>
                        </span>
                    )}
                </div>
                {buttonLink && buttonText && (
                    <Link
                        to={buttonLink}
                        className="usa-button usa-button--outline display-flex flex-align-center margin-0 padding-105"
                    >
                        <svg
                            className="height-2 width-2 margin-right-05 cursor-pointer"
                            style={{ fill: "#005ea2" }}
                        >
                            <use href={`${icons}#add`}></use>
                        </svg>
                        <span>{buttonText}</span>
                    </Link>
                )}
            </div>
            <div className="display-flex flex-align-center flex-justify padding-y-1">
                {TabsSection}
                {FYSelect && FYSelect}
            </div>
            <div className="display-flex flex-justify flex-align-center padding-y-1">
                <h2 className="margin-0">{subtitle}</h2>
                {FilterButton}
            </div>
            <p>{details}</p>
            {FilterTags}
            {SummaryCardsSection && <div className="margin-top-1">{SummaryCardsSection}</div>}
            <div className="margin-top-4">{TableSection}</div>
            {children}
        </>
    );
};

export default TablePageLayout;

TablePageLayout.propTypes = {
    buttonLink: PropTypes.string,
    buttonText: PropTypes.string,
    children: PropTypes.node,
    details: PropTypes.string.isRequired,
    FilterButton: PropTypes.node,
    FilterTags: PropTypes.node,
    FYSelect: PropTypes.node,
    subtitle: PropTypes.string.isRequired,
    SummaryCardsSection: PropTypes.node,
    TableSection: PropTypes.node,
    TabsSection: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    titleTooltip: PropTypes.string
};
