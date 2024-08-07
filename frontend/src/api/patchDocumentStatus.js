import ApplicationContext from "../applicationContext/ApplicationContext";

export const patchDocumentStatus = async (document_id, data) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

    return await ApplicationContext.get().helpers().callBackend(
        `/api/${api_version}/documents/${document_id}/status/`,
        "patch",
        {...data}
    );
};
