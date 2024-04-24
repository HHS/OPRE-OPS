import PropTypes from "prop-types";
/**
 * Renders a page header with a title and optional subtitle.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.title - The title to display.
 * @param {string} [props.subTitle] - The optional subtitle to display.
 * @returns {JSX.Element} - The rendered component.
 */
const PageHeader = ({ title, subTitle }) => {
    return (
        <div className="margin-bottom-3">
            <h1 className="margin-0 text-brand-primary font-sans-2xl">{title}</h1>
            {subTitle && <p className="font-sans-3xs margin-0">{subTitle}</p>}
        </div>
    );
};

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subTitle: PropTypes.string
};
export default PageHeader;
