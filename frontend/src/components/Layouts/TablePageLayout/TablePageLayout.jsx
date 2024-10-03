import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import icons from "../../../uswds/img/sprite.svg";

/**
 * The TablePageLayout component is a layout component that displays a title and subtitle
 *
 * @component
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.FilterButton] - The filter button to display.
 * @param {React.ReactNode} [props.FilterTags] - The filter tags to display.
 * @param {React.ReactNode} [props.FYSelect] - The fiscal year select to display.
 * @param {React.ReactNode} [props.SummaryCardsSection] - The summary cards to display.
 * @param {React.ReactNode} [props.TableSection] - The table to display.
 * @param {React.ReactNode} [props.children] - The children to render - optional.
 * @param {React.ReactNode} props.TabsSection - The tabs to display.
 * @param {string} [props.buttonLink] - The link to navigate to when the button is clicked.
 * @param {string} [props.buttonText] - The text to display on the button.
 * @param {string} props.details - The details to display.
 * @param {string} props.subtitle - The subtitle to display.
 * @param {string} props.title - The title to display.
 * @returns {JSX.Element} - The rendered component.
 */
export const TablePageLayout = ({
    FilterButton = null,
    FilterTags = null,
    FYSelect,
    SummaryCardsSection,
    TableSection = null,
    TabsSection,
    buttonLink,
    buttonText,
    children,
    details,
    subtitle,
    title
}) => {
    return (
        <>
            <div className="display-flex flex-align-center flex-justify margin-bottom-205">
                <h1 className="margin-0 text-brand-primary font-sans-2xl">{title}</h1>
                {buttonLink && buttonText && (
                    <Link
                        to={buttonLink}
                        className="usa-button usa-button--outline display-flex flex-align-center margin-0 padding-105"
                    >
                        <svg
                            className="height-2 width-2 margin-right-05 cursor-pointer"
                            style={{ fill: "#005ea2" }}
                        >
                            <use xlinkHref={`${icons}#add`}></use>
                        </svg>
                        <span>{buttonText}</span>
                    </Link>
                )}
            </div>
            <div className="display-flex flex-align-center flex-justify padding-y-1">
                {TabsSection}
                {FYSelect && FYSelect}
            </div>
            <div className="display-flex flex-justify padding-y-1">
                <div>
                    <h2 className="margin-0">{subtitle}</h2>
                    <p>{details}</p>
                </div>
                {FilterButton}
            </div>
            {FilterTags}
            {SummaryCardsSection && SummaryCardsSection}
            {TableSection}
            {children}
        </>
    );
};

export default TablePageLayout;

TablePageLayout.propTypes = {
    FilterButton: PropTypes.node,
    FilterTags: PropTypes.node,
    FYSelect: PropTypes.node,
    SummaryCardsSection: PropTypes.node,
    TableSection: PropTypes.node,
    TabsSection: PropTypes.node.isRequired,
    buttonLink: PropTypes.string,
    buttonText: PropTypes.string,
    children: PropTypes.node,
    details: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
};
