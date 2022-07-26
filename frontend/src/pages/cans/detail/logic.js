import { setCan } from "./canSlice";
import { callBackend } from "../../../helpers/backend";

export const getCan = (id) => {
    return async (dispatch, getState) => {
        const resonseData = await callBackend(`/ops/cans/${id}`, "get");
        dispatch(setCan(resonseData));
    };
};
