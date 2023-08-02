import ApplicationContext from "../applicationContext/ApplicationContext";

export const patchBudgetLineItem = async (item) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    console.log("patch item", item);

    // TODO: These are hacks to transform the state into a valid BLI for the backend
    const data = { ...item }; // make a copy - item is read only

    if (data.date_needed === "--") {
        data.date_needed = null;
    }
    const budgetLineId = data.id;
    delete data.created_by;
    delete data.created_on;
    delete data.updated_on;
    delete data.can;
    delete data.id;

    const responseData = ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/budget-line-items/${budgetLineId}`, "PATCH", data)
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(`error.data: ${error.response.data}`);
                console.log(`error.status: ${error.response.status}`);
                console.log(`error.headers: ${error.response.headers}`);
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

export const patchBudgetLineItems = async (items) => {
    return Promise.all(items.map((item) => patchBudgetLineItem(item)));
};
