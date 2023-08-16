import PropTypes from "prop-types";

/**
 * The TablePageLayout component is a layout component that displays a title and subtitle
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The children to render.
 * @param {string} props.title - The title to display.
 * @param {string} props.subtitle - The subtitle to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const TablePageLayout = ({ children, title, subtitle }) => {
    return (
        <>
            <h1 className="font-sans-lg">{title}</h1>
            <p>{subtitle}</p>
            {children}
        </>
    );
};

export default TablePageLayout;

TablePageLayout.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
};
