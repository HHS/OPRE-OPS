import store from "../store";

export const dispatchUsecase = async (usecase) => {
    const dispatch = store.dispatch;
    const getState = store.getState;

    return await usecase(dispatch, getState);
};
