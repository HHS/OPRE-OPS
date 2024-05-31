import PropTypes from "prop-types";

/**
 * Renders the list of documents for an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {Object[]} props.documents - The list of documents to display
 * @returns {JSX.Element} - The rendered component.
 */
const DocumentCollectionView = ({ documents }) => {
    return <section>{documents.length > 0 ? <div>Documents Uploaded</div> : <div>No Documents Uploaded</div>}</section>;
};

DocumentCollectionView.propTypes = {
    documents: PropTypes.object.isRequired
};

export default DocumentCollectionView;
