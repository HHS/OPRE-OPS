import { ALLOWED_FAKE_HOSTS, ALLOWED_HOSTS, DOCUMENT_CONTAINER_NAME, VALID_EXTENSIONS } from "./Documents.constants.js";
import { BlobServiceClient } from "@azure/storage-blob";

const fileStorage = []; // Global variable to store files in memory

// Converts the file size from bytes to megabytes (MB) and rounds to two decimal places
export const convertFileSizeToMB = (size) => {
    return parseFloat((size / (1024 * 1024)).toFixed(2));
};

// Checks if the file is a valid type (PDF, Word, or Excel)
export const isFileValid = (file) => {
    if (!file) return false;
    const fileExtension = file.name.split(".").pop().toLowerCase();
    return VALID_EXTENSIONS.includes(fileExtension);
};

// Process file upload based on the specified storage repository
export const processUploading = async (source, uuid, file, agreementId, inMemoryUpload, inBlobUpload) => {
    try {
        if (source.includes(ALLOWED_FAKE_HOSTS)) {
            // Upload to an in-memory storage repository
            await inMemoryUpload(uuid, file);
        } else if (source.includes(ALLOWED_HOSTS)) {
            // Upload to Azure Blob Storage
            await inBlobUpload(source, uuid, file);
        } else {
            // Log an error if the repository type is invalid
            console.error("Invalid repository type:", source);
        }
    } catch (error) {
        console.error("Error processing upload:", error);
    }
};

// Sanitize a filename coming from the API before using it as the browser's
// download suggestion: strip path separators, control chars, and leading dots
// to prevent directory-traversal-style names from reaching the save dialog.
/** @param {unknown} rawName */
export const sanitizeDownloadFilename = (rawName) => {
    const fallback = "document";
    if (typeof rawName !== "string" || rawName.length === 0) return fallback;
    // eslint-disable-next-line no-control-regex
    const cleaned = rawName.replace(/[/\\\x00-\x1F\x7F]/g, "_").replace(/^\.+/, "");
    return cleaned.length > 0 ? cleaned : fallback;
};

/**
 * @param {Blob} blob
 * @param {string} fileName
 */
const triggerDownload = (blob, fileName) => {
    const objectUrl = URL.createObjectURL(blob);

    // Detached anchor — modern browsers honor .click() without inserting the
    // element into the DOM, which avoids the appendChild DOM-XSS sink that
    // Snyk flags when API-sourced file names flow into the page.
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = sanitizeDownloadFilename(fileName);
    a.click();

    URL.revokeObjectURL(objectUrl);
};

// AZURE BLOB STORAGE //

export const getClient = (sasUrl) => {
    // Create a BlobServiceClient instance using the provided SAS URL
    const blobServiceClient = new BlobServiceClient(sasUrl);

    // Retrieve and return the client for the specified document container
    return blobServiceClient.getContainerClient(DOCUMENT_CONTAINER_NAME);
};

// Upload a file to Azure Blob Storage
export const uploadDocumentToBlob = async (sasUrl, uuid, file) => {
    try {
        // Get a client for the target container
        const containerClient = getClient(sasUrl);

        // Get a BlockBlobClient for the specific blob identified by the UUID
        const blockBlobClient = containerClient.getBlockBlobClient(uuid);

        // Create a Blob object from the file data
        const blob = new Blob([file], { type: file.type });

        // Upload the Blob to Azure Blob Storage
        const uploadBlobResponse = await blockBlobClient.uploadData(blob);

        // Log success message with request id
        console.log(
            `UUID=${uuid} - Uploaded successfully to Azure storage account. RequestId=${uploadBlobResponse.requestId}.`
        );
    } catch (error) {
        console.error("Error uploading file to Azure Blob Storage:", error);
    }
};

// Downloads a document from Azure Blob Storage and saves it to the local filesystem
export const downloadDocumentFromBlob = async (sasUrl, documentId, fileName) => {
    try {
        // Get a reference to the container client using the SAS URL
        const containerClient = getClient(sasUrl);

        // Get a reference to the specific blob (document) using its uuid
        const blobClient = containerClient.getBlobClient(documentId);

        // Download the blob
        const downloadBlobResponse = await blobClient.download();
        const blob = await downloadBlobResponse.blobBody;
        if (!blob) {
            console.error("Downloaded blob is empty. document_id:", documentId);
            return;
        }

        triggerDownload(blob, fileName);
    } catch (error) {
        console.error("Error downloading blob. document_id:", documentId, "error:", error);
    }
};

// IN-MEMORY STORAGE //

export const uploadDocumentToInMemory = async (uuid, file) => {
    try {
        const reader = new FileReader();

        const fileReadPromise = new Promise((resolve, reject) => {
            reader.onload = () => {
                fileStorage[uuid] = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: reader.result // File content as ArrayBuffer
                };
                resolve();
            };

            reader.onerror = () => {
                reject(new Error("Error reading file"));
            };
        });

        reader.readAsArrayBuffer(file);
        await fileReadPromise;

        console.log(`UUID=${uuid} - Uploaded successfully to in-memory storage.`);
    } catch (error) {
        console.error("Error uploading file to in-memory storage:", error);
    }
};

export const downloadFileFromMemory = (uuid) => {
    const file = fileStorage[uuid];
    const blob = new Blob([file.content], { type: file.type });
    triggerDownload(blob, file.name);
};
