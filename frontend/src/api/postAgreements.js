import ApplicationContext from "../applicationContext/ApplicationContext";

export const postAgreement = async (item) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

    const data = { ...item };
    const newAgreement = {
        ...data,
        number: "",
    };

    delete newAgreement.id;
    delete newAgreement.selected_product_service_code;

    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/agreements/`, "POST", newAgreement)
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.newAgreement);
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

export const formatTeamMember = (team_member) => {
    return {
        id: team_member.id,
        full_name: team_member.full_name,
        email: team_member.email,
    };
};
