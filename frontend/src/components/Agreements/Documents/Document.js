import {DOCUMENT_CONTAINER_NAME, VALID_EXTENSIONS} from "./Documents.constants.js";
import {BlobServiceClient} from "@azure/storage-blob";
import {patchDocumentStatus} from "../../../api/patchDocumentStatus.js";


// Converts the file size from bytes to megabytes (MB) and rounds to two decimal places
export const convertFileSizeToMB = (size) => {
    return parseFloat((size / (1024 * 1024)).toFixed(2))
}

// Checks if the file is a valid type (PDF, Word, or Excel)
export const isFileValid = (file) => {
    if (!file) return false;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return VALID_EXTENSIONS.includes(fileExtension);
};

export const patchStatus = async (uuid, statusData) => {
    try {
        // Send a request to update the document status
        const response = await patchDocumentStatus(uuid, statusData);

        // Log the response from the server and success message
        console.log('patchDocumentStatus response', response);
        console.log(`UUID=${uuid} - Status updated to "${statusData.status}".`);
    } catch (error) {
        console.error('Failed to update document status:', error);
    }
};

// Process file upload based on the specified storage repository
export const processUploading = async (sasUrl, uuid, file, agreementId) => {
    try {
        if (sasUrl.includes('FakeDocumentRepository')) {
            // Upload to an in-memory storage repository
            await uploadDocumentToInMemory(uuid, file);
        } else if (sasUrl.includes('blob.core.windows.net')) {
            // Upload to Azure Blob Storage
            await uploadDocumentToBlob(sasUrl, uuid, file);
        } else {
            // Log an error if the repository type is invalid
            console.error('Invalid repository type:', sasUrl);
        }
        // Update the document status after successful upload
        const statusData = {
            agreement_id: agreementId,
            status: 'uploaded'
        };
        await patchStatus(uuid, statusData);
    } catch (error) {
        console.error('Error processing upload:', error);
    }
};

const triggerDownload = (blob, fileName) => {
    // Convert the blob to a URL that can be used to download the file
    const objectUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element to initiate the download
    const a = document.createElement('a');
    a.href = objectUrl; // Set the href to the blob URL
    a.download = `${fileName}`; // Set the name for the downloaded file
    document.body.appendChild(a); // Append the anchor element to the body
    a.click(); // Programmatically click the anchor to trigger the download
    document.body.removeChild(a); // Clean up: remove the anchor element

    // Clean up: revoke the object URL after the download is triggered (to free up memory)
    URL.revokeObjectURL(objectUrl);
};


// AZURE BLOB STORAGE //

const getContainerClient = (sasUrl) => {
    // Create a BlobServiceClient instance using the provided SAS URL
    const blobServiceClient = new BlobServiceClient(sasUrl);

    // Retrieve and return the client for the specified document container
    return blobServiceClient.getContainerClient(DOCUMENT_CONTAINER_NAME)
}

// Upload a file to Azure Blob Storage
export const uploadDocumentToBlob = async (sasUrl, uuid, file) => {
    try {
        // Get a client for the target container
        const containerClient = getContainerClient(sasUrl);

        // Get a BlockBlobClient for the specific blob identified by the UUID
        const blockBlobClient = containerClient.getBlockBlobClient(uuid);

        // Create a Blob object from the file data
        const blob = new Blob([file.file], { type: file.type });

        // Upload the Blob to Azure Blob Storage
        const uploadBlobResponse = await blockBlobClient.uploadData(blob);

        // Log success message with request id
        console.log(`UUID=${uuid} - Uploaded successfully to Azure storage account. RequestId=${uploadBlobResponse.requestId}.`);
    } catch (error) {
        console.error('Error uploading file to Azure Blob Storage:', error)
    }
};

// Downloads a document from Azure Blob Storage and saves it to the local filesystem
export const downloadDocumentFromBlob = async (sasUrl, documentId, fileName) => {
     try {
         // Get a reference to the container client using the SAS URL
         const containerClient = getContainerClient(sasUrl);

         // Get a reference to the specific blob (document) using its uuid
         const blobClient = containerClient.getBlobClient(documentId);

         // Download the blob
         const downloadBlobResponse = await blobClient.download();
         const blob = await downloadBlobResponse.blobBody;

         triggerDownload(blob, fileName);
     } catch (error) {
         console.error(`Error downloading blob=${documentId}:`, error);
     }
};

// IN-MEMORY STORAGE
const fileStorage = {}; // Global variable to store files in memory

export const uploadDocumentToInMemory = async (uuid, file) => {
    try {
        const reader = new FileReader();

        // This promise will resolve when the file is successfully read
        const fileReadPromise = new Promise((resolve, reject) => {
            reader.onload = () => {
                // Store file in the global object
                fileStorage[uuid] = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: reader.result // File content as ArrayBuffer
                };
                resolve();
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
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
