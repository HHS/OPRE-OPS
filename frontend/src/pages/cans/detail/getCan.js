import { setCan } from "./canDetailSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getCan = (id) => {
    return async (dispatch, getState) => {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/cans/${id}`, "get");
        dispatch(setCan(responseData));
    };
};
