import { DocumentCollectionHeader } from "./DocumentCollectionHeader";
import DocumentCollectionView from "./DocumentCollectionView";
/**
 * Renders the document collection view
 * @component
 * @returns {JSX.Element} - The rendered component
 */
const DocumentView = () => {
    return (
        <>
            <DocumentCollectionHeader
                heading="Documents"
                details=""
                isEditMode={false}
                setIsEditMode={() => {}}
                isEditable={true}
            />
            <DocumentCollectionView documents={[]} />
        </>
    );
};

export default DocumentView;
