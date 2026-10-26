import FileUploadButton from "../../UI/Button/FileUploadButton";

// Upload isn't available anywhere in OPS yet (the Documents tab is "coming soon"), so the slots
// are shown disabled, matching the pre-award approval page.
const UPLOAD_COMING_SOON =
    "Documents tab is coming soon! For now, please upload to the OPRE preferred tool to share documents";

const MODIFICATION_DOCUMENT_SLOTS = [
    { documentType: "CONTRACT_MODIFICATION_MEMO", label: "Contract Modification Memo" },
    {
        documentType: "REVISED_INDEPENDENT_GOVERNMENT_COST_ESTIMATE",
        label: "Revised Independent Government Cost Estimate (IGCE)"
    },
    { documentType: "CERTIFICATION_OF_FUNDING", label: "Certificate of Funding" },
    { documentType: "REVISED_STATEMENT_OF_REQUIREMENTS", label: "Revised Statement of Requirements (SOW/PWS)" },
    { documentType: "ADDITIONAL_DOCUMENT", label: "Additional Documents (if applicable)" }
];

/**
 * @param {Object} props
 * @param {string} props.documentType
 * @param {string} props.label
 */
const ModificationDocumentSlot = ({ documentType, label }) => {
    const id = `mod-document-${documentType.toLowerCase().replaceAll("_", "-")}`;
    return (
        <div data-cy={id}>
            <FileUploadButton
                id={id}
                label={label}
                disabled={true}
                disabledTooltip={UPLOAD_COMING_SOON}
                width="100%"
            />
        </div>
    );
};

/**
 * The Upload Documents section of the Start Modification page (#3268).
 */
const ModificationDocumentUploads = () => {
    // The named slots sit in a two-column grid; Additional Documents goes on its own row below.
    const named = MODIFICATION_DOCUMENT_SLOTS.slice(0, -1);
    const additional = MODIFICATION_DOCUMENT_SLOTS.at(-1);
    const renderSlot = (slot) => (
        <ModificationDocumentSlot
            key={slot.documentType}
            documentType={slot.documentType}
            label={slot.label}
        />
    );
    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
                {named.map(renderSlot)}
            </div>
            <div className="margin-top-4">{renderSlot(additional)}</div>
        </>
    );
};

export default ModificationDocumentUploads;
