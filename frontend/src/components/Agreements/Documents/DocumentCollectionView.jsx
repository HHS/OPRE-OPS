import PropTypes from "prop-types";
import DocumentCard from "../../UI/DocumentCard/DocumentCard";

/**
 * Renders the list of documents for an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {Array<Object>} props.documents - The list of documents to display
 * @returns {JSX.Element} - The rendered component.
 */
const DocumentCollectionView = ({ documents }) => {
    return (
        <section className="display-flex">
            {documents.length > 0 ? (
                <div
                    className="display-flex flex-wrap"
                    style={{ columnGap: "20px" }}
                >
                    {documents.map((document, docIndex) => (
                        <div key={docIndex}>
                            <DocumentCard document={document} />
                        </div>
                    ))}
                </div>
            ) : (
                <div>No Documents Uploaded</div>
            )}
        </section>
    );
};

DocumentCollectionView.propTypes = {
    documents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default DocumentCollectionView;
