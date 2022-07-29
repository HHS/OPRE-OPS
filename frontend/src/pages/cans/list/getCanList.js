import { setCanList } from "./canListSlice";
import { callBackend } from "../../../helpers/backend";

export const getCanList = () => {
    return async (dispatch, getState) => {
        const responseData = await callBackend("/ops/cans", "get");
        dispatch(setCanList(responseData));
    };
};
