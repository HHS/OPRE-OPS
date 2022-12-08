import { setCan } from "./canDetailSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getCan = (id) => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get().helpers().callBackend(`/api/v1/cans/${id}`, "get");
        dispatch(setCan(responseData));
    };
};
