import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import icons from "../../../../uswds/img/sprite.svg";

/**
 * The TablePageLayout component is a layout component that displays a title and subtitle
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The children to render - optional.
 * @param {string} props.title - The title to display.
 * @param {string} props.subtitle - The subtitle to display.
 * @param {React.ReactNode} props.TabsSection - The tabs to display.
 * @param {React.ReactNode} props.FilterSection - The filter to display.
 * @param {React.ReactNode} props.TableSection - The table to display.
 * @param {string} props.buttonText - The text to display on the button.
 * @param {string} props.buttonLink - The link to navigate to when the button is clicked.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const TablePageLayout = ({
    children,
    title,
    subtitle,
    TabsSection,
    FilterSection,
    TableSection,
    buttonText,
    buttonLink,
}) => {
    return (
        <>
            <h1 className="font-sans-lg">{title}</h1>
            <p>{subtitle}</p>
            <div className="padding-top-05 padding-bottom-05 display-flex flex-align-center flex-justify">
                {TabsSection}
                <Link
                    to={buttonLink}
                    className="usa-button usa-button--outline display-flex flex-align-center margin-0 padding-105"
                >
                    <svg
                        className="height-2 width-2 margin-right-05 hover: cursor-pointer usa-tooltip "
                        style={{ fill: "#005ea2" }}
                    >
                        <use xlinkHref={`${icons}#add`}></use>
                    </svg>
                    <span className="">{buttonText}</span>
                </Link>
            </div>
            {FilterSection}
            {TableSection}
            {children}
        </>
    );
};

export default TablePageLayout;

TablePageLayout.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    TabsSection: PropTypes.node.isRequired,
    FilterSection: PropTypes.node.isRequired,
    TableSection: PropTypes.node.isRequired,
    buttonText: PropTypes.string.isRequired,
    buttonLink: PropTypes.string.isRequired,
};
