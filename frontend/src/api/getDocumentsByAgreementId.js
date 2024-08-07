import ApplicationContext from "../applicationContext/ApplicationContext";

export const getDocumentsByAgreementId = async (agreement_id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

    return await ApplicationContext.get().helpers().callBackend(
        `/api/${api_version}/documents/${agreement_id}/`,
        "get"
    );
};
