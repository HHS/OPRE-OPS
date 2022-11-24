import { setCan } from "./canCardDetailSlice";
import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getPortfolio = async (id) => {
    const responseData = await ApplicationContext.get().helpers().callBackend(`/ops/portfolios/${id}`, "get");
    return responseData;
};

export const getCan = async (id) => {
    const responseData = await ApplicationContext.get().helpers().callBackend(`/ops/cans/${id}`, "get");
    return responseData;
};

export const getCanAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getCan(id);
        dispatch(setCan(responseData));
    };
};
