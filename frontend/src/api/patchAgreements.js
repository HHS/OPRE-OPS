import ApplicationContext from "../applicationContext/ApplicationContext";

export const patchAgreement = async (id, item) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const data = { ...item };
    // remove fields that are not allowed
    const { id: _id, budget_line_items, created_by, created_on, updated_on, ...patchData } = data;

    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/agreements/${id}`, "PATCH", patchData)
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.message);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log("Error", error.message);
            }
            console.log(error.config);
        });

    return responseData;
};
