import store from "../store";

export const dispatchUsecase = async (usecase) => {
    const dispatch = store.dispatch;
    const getState = store.getState;

    return await usecase(dispatch, getState);
};

export const authConfig = {
    loginGovAuthorizationEndpoint: "https://dummy/123/",
};
