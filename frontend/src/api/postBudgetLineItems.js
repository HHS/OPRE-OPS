import ApplicationContext from "../applicationContext/ApplicationContext";

export const postBudgetLineItem = async (item) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

    console.log("item", item);

    // TODO: These are hacks to transform the state into a valid BLI for the backend
    const data = { ...item }; // make a copy - item is read only

    if (data.date_needed === "--") {
        data.date_needed = null;
    }

    delete data.created_by;
    delete data.can;
    delete data.id;

    console.log("item", data);
    // TODO: Redo using RTK Query?
    const responseData = ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/budget-line-items/`, "POST", data)
        .then(function (response) {
            console.log(`Budget Line Created: ${response}`);
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

export const postBudgetLineItems = async (items) => {
    console.log("post budget line items", items);
    return Promise.all(items.map((item) => postBudgetLineItem(item)));
};
