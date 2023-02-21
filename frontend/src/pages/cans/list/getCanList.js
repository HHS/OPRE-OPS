import { setCanList } from "./canListSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getCanList = () => {
    return async (dispatch, getState) => {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get().helpers().callBackend(`/api/${api_version}/cans/`, "get");
        dispatch(setCanList(responseData));
    };
};
