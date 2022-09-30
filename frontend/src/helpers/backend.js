import axios from "axios";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const callBackend = async (urlPath, action, requestBody, queryParams) => {
    console.log(`Calling backend at ${urlPath}`);

    const response = await axios({
        method: action,
        url: `${BACKEND_DOMAIN}${urlPath}`,
        data: requestBody,
        params: queryParams,
    });

    return response.data;
};
