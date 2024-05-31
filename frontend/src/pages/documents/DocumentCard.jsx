import PropTypes from "prop-types";
/**
 * Renders an individual document
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.document - The document this card renders
 * @returns {JSX.Element} - The rendered component
 */
const DocumentCard = ({ document }) => {
    console.log(document);
    return <div>Hello World</div>;
};

DocumentCard.propTypes = {
    document: PropTypes.object.isRequired
};
