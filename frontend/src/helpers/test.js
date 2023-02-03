import store from "../store";

export const dispatchUsecase = async (usecase) => {
    const dispatch = store.dispatch;
    const getState = store.getState;

    return await usecase(dispatch, getState);
};

export const authConfig = {
    loginGovAuthorizationEndpoint: "https://dummy/123",
    acr_values: "http://acr/values",
    client_id: "blah:blah",
    response_type: "blah",
    scope: "blah blah",
    redirect_uri: "http://uri/login",
};

export const backEndConfig = {
    apiVersion: "v1",
};
