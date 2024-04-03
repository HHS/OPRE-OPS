import { useState } from "react";
import { BlobServiceClient } from "@azure/storage-blob";
import { getAzureSasToken } from "../../../api/getAzureToken";

const FileUpload = () => {
    const [file, setFile] = useState(null);

    const onFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const onFileUpload = async () => {
        if (!file) {
            alert("Please select a file to upload");
            return;
        }

        try {
            const sasToken = await getAzureSasToken(); // Replace with your SAS token from API
            console.log(`Azure SAS Token: ${sasToken}`);
            if (!sasToken) {
                return;
            }

            // TODO: Update with your Azure Storage Account URL or from runtime config
            const testUrl = "https://your_storage_account.blob.core.windows.net/";
            const blobServiceSasUrl = `${testUrl}?${sasToken}`;
            //console.log(`Azure Storage Acct: ${blobServiceSasUrl}`);
            const blobServiceClient = new BlobServiceClient(blobServiceSasUrl);

            // Replace "your_container_name" with your Azure Blob Storage container name
            const containerName = "uploads";
            //console.log(`Azure Container: ${containerName}`);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            // Use the file name as the blob name
            const blobName = file.name;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            // Upload the file
            await blockBlobClient.uploadData(file);

            alert("File uploaded successfully!");
        } catch (error) {
            console.error("File upload error:", error);
            alert("File upload failed!");
        }
    };

    return (
        <div className="usa-form-group">
            <label
                className="usa-label"
                htmlFor="file-input-single"
            >
                Input accepts a single file
            </label>
            <input
                type="file"
                className="usa-file-input"
                id="file-input"
                name="file-input"
                onChange={onFileChange}
            />
            <button
                type="button"
                onClick={onFileUpload}
                className="usa-button"
            >
                Upload
            </button>
        </div>
        // <div>
        //
        //     <button onClick={onFileUpload}>
        //         Upload
        //     </button>
        // </div>
    );
};

export default FileUpload;
