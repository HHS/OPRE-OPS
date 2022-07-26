import axios from "axios";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const callBackend = async (urlPath, action, requestBody) => {
    console.log(`${BACKEND_DOMAIN}${urlPath}`);
    const response = await axios({
        method: action,
        url: `${BACKEND_DOMAIN}${urlPath}`,
        data: requestBody,
    });

    return response.data;
};
