import {useState} from "react";
import {postDocument} from "../../../api/postDocument.js";
import {getDocumentsByAgreementId} from "../../../api/getDocumentsByAgreementId.js";
import {
    downloadDocumentFromBlob,
    downloadFileFromMemory,
    isFileValid, patchStatus,
    processUploading, uploadDocumentToBlob,
    uploadDocumentToInMemory
} from "./Document.js";
import {DOCUMENT_TYPES} from "./Documents.constants.js";

// This component is a temporary page for testing document upload and download functionality
// The local host URL for this page is http://localhost:3000/upload-document

const UploadDocument = () => {
    const [file, setFile] = useState(null);
    const [agreementId, setAgreementId] = useState(0);
    const [getDocumentAgreementId, setGetDocumentAgreementId] = useState(0);
    const [selectedDocumentType, setSelectedDocumentType] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (selectedFile) {
            if (isFileValid(selectedFile)) {
                setFile(selectedFile)
            } else {
                console.error("Invalid file type. Please upload a PDF, Word, or Excel document.");
                setFile(null)
            }
        } else {
            console.error("No file selected.");
        }
    };

    const handleUpload = async () => {
        try {
            const documentData = {
                agreement_id: agreementId,
                document_type: selectedDocumentType,
                file_name: file.name,
                // file_size: convertFileSizeToMB(file.size),
            };

            // Save a record of the document in the database
            const response = await postDocument(documentData);
            console.log("postDocument response", response);
            const {url, uuid} = response;
            console.log(`UUID=${uuid} - Database record created successfully.`);

            // Upload the document to specified storage
            await processUploading(url, uuid, file, agreementId, uploadDocumentToInMemory, uploadDocumentToBlob, patchStatus);

        } catch (error) {
            console.error("Error in handleUpload:", error);
        }
    };

    const handleGetDocumentByAgreementId = async () => {
        try {
            // Call the endpoint to get documents by Agreement ID
            const response = await getDocumentsByAgreementId(getDocumentAgreementId);
            console.log("getDocumentsByAgreementId response", response);

            const {url, documents} = response;

            if (documents.length > 0) {
                for (const document of documents) {
                    if (url.includes("FakeDocumentRepository")) {
                        downloadFileFromMemory(document.document_id);
                    } else {
                        await downloadDocumentFromBlob(url, document.document_id, document.file_name);
                    }
                }
                console.log(`All documents for agreement ${getDocumentAgreementId} downloaded successfully.`);
            } else {
                console.log("No documents found for the provided Agreement ID.");
            }
        } catch (error) {
            console.error("Error in handleGetDocumentByAgreementId:", error);
        }
    };

    return (
        <div>
            <header>
                <h1 style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    color: "#333" // Ensures better contrast for the heading
                }}>
                    Temporary Upload Document Page
                </h1>
            </header>
            <main>


                <div style={{
                    maxWidth: "600px",
                    margin: "auto",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                >
                    {/* DOCUMENT UPLOAD SECTION */}
                    <section style={{marginBottom: "40px"}}>
                        <h2 style={{marginBottom: "15px", color: "#333"}}>Upload Document</h2>

                        {/* Agreement ID Input */}
                        <div style={{marginBottom: "20px"}}>
                            <label
                                htmlFor="agreement-id-upload"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#333"
                                }}
                            >
                                Agreement ID:
                            </label>
                            <input
                                type="number"
                                id="agreement-id-upload"
                                onChange={(e) => {
                                    setAgreementId(parseInt(e.target.value))
                                }}
                                placeholder="Enter Agreement ID"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px"
                                }}
                            />
                        </div>

                        {/* File Input */}
                        <div style={{marginBottom: "20px"}}>
                            <label
                                htmlFor="file-upload"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#333"
                                }}
                            >
                                File:
                            </label>
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    padding: "10px"
                                }}
                            />
                        </div>

                        {/* Document Type Dropdown */}
                        <div style={{marginBottom: "20px"}}>
                            <label
                                htmlFor="document-type"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#333"
                                }}
                            >
                                Type:
                            </label>
                            <select
                                id="document-type"
                                name="document-type"
                                value={selectedDocumentType}
                                onChange={(e) => {
                                    setSelectedDocumentType(e.target.value)
                                }}
                                aria-label="Document Type"
                                aria-required="true"
                                style={{
                                    width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px"
                                }}
                            >
                                <option value="">Select a type</option>
                                {DOCUMENT_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type.replace(/_/g, " ")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action Button for Upload */}
                        <button
                            onClick={handleUpload}
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "none",
                                borderRadius: "4px",
                                backgroundColor: "#555",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            Upload
                        </button>
                    </section>

                    {/* GET DOCUMENTS BY AGREEMENT ID SECTION */}
                    <section style={{marginBottom: "40px"}}>
                        <h2 style={{marginBottom: "15px", color: "#333"}}>Get Documents by Agreement ID</h2>

                        {/* Agreement ID Input */}
                        <div style={{marginBottom: "20px"}}>
                            <label
                                htmlFor="agreement-id-get"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#333"
                                }}
                            >
                                Agreement ID:
                            </label>
                            <input
                                type="number"
                                id="agreement-id-get"
                                onChange={(e) => {
                                    setGetDocumentAgreementId(parseInt(e.target.value))
                                }}
                                placeholder="Enter Agreement ID"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px"
                                }}
                            />
                        </div>

                        {/* Action Button for Get Documents by Agreement ID */}
                        <button
                            onClick={handleGetDocumentByAgreementId}
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "none",
                                borderRadius: "4px",
                                backgroundColor: "#555",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            Get Documents
                        </button>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default UploadDocument;
