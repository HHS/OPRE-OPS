import * as React from "react";
import { useAddDocumentMutation, useUpdateDocumentStatusMutation } from "../../../api/opsAPI";
import FileUploadButton from "../../UI/Button/FileUploadButton";
import {
    convertFileSizeToMB,
    isFileValid,
    processUploading,
    uploadDocumentToBlob,
    uploadDocumentToInMemory
} from "../Documents/Document";

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
 * One upload slot. The file is uploaded to the agreement as soon as it's picked, so it shows on
 * the agreement's Documents tab whether or not the modification is sent.
 * @param {Object} props
 * @param {number} props.agreementId
 * @param {string} props.documentType
 * @param {string} props.label
 */
const ModificationDocumentSlot = ({ agreementId, documentType, label }) => {
    const [addDocument] = useAddDocumentMutation();
    const [updateDocumentStatus] = useUpdateDocumentStatusMutation();
    const [uploadedFile, setUploadedFile] = React.useState(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleFileChange = async (/** @type {any} */ e) => {
        const file = e.target.files?.[0];
        setError("");
        if (!file) return;
        if (!isFileValid(file)) {
            setError("Invalid file type. Please upload a PDF, Word, or Excel document.");
            return;
        }
        setIsUploading(true);
        try {
            const { url, uuid } = await addDocument({
                agreement_id: agreementId,
                document_type: documentType,
                document_name: file.name,
                document_size: convertFileSizeToMB(file.size)
            }).unwrap();
            await processUploading(url, uuid, file, agreementId, uploadDocumentToInMemory, uploadDocumentToBlob);
            await updateDocumentStatus({
                document_id: uuid,
                data: { agreement_id: agreementId, status: "uploaded" }
            }).unwrap();
            setUploadedFile(file);
        } catch {
            setError("Failed to upload document. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const id = `mod-document-${documentType.toLowerCase().replaceAll("_", "-")}`;
    return (
        <div data-cy={id}>
            <FileUploadButton
                id={id}
                acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx"
                onFileChange={handleFileChange}
                selectedFile={uploadedFile}
                label={label}
                disabled={isUploading}
                disabledTooltip="Upload in progress..."
                width="100%"
            />
            {error && (
                <span
                    className="usa-error-message font-12px"
                    role="alert"
                >
                    {error}
                </span>
            )}
        </div>
    );
};

/**
 * The Upload Documents section of the Start Modification page (#3268).
 * @param {Object} props
 * @param {number} props.agreementId
 */
const ModificationDocumentUploads = ({ agreementId }) => {
    // The named slots sit in a two-column grid; Additional Documents goes on its own row below.
    const named = MODIFICATION_DOCUMENT_SLOTS.slice(0, -1);
    const additional = MODIFICATION_DOCUMENT_SLOTS.at(-1);
    const renderSlot = (slot) => (
        <ModificationDocumentSlot
            key={slot.documentType}
            agreementId={agreementId}
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
