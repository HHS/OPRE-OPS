import ApplicationContext from "../applicationContext/ApplicationContext";

export const postAgreement = async (item) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

    console.log("item", item);

    const data = { ...item };

    console.log("item", data);

    const responseData = ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/agreements/`, "POST", data)
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
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

export const postBudgetLineItems = async (items) => {
    console.log("items", items);
    return Promise.all((item) => {
        postAgreement(item);
    });
};
