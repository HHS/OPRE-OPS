import PropTypes from "prop-types";
import { document } from "../../../tests/data";
import { DocumentCollectionHeader } from "./DocumentCollectionHeader";
import DocumentCollectionView from "./DocumentCollectionView";
/**
 * Renders the document collection view
 * @param {object} props - The component props.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @component
 * @returns {JSX.Element} - The rendered component
 */
const DocumentView = ({ isEditMode, setIsEditMode }) => {
    return (
        <>
            <DocumentCollectionHeader
                heading="Documents"
                details="This is a list of all documents within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={true}
            />
            <DocumentCollectionView documents={document.testDocuments} />
        </>
    );
};

DocumentView.propTypes = {
    isEditMode: PropTypes.bool.isRequired,
    setIsEditMode: PropTypes.func.isRequired
};
export default DocumentView;
