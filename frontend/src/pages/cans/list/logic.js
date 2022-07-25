import { setCanList } from "./canListSlice";
import axios from "axios";

export const getCanList = () => {
    return async (dispatch, getState) => {
        const response = await axios.get("http://localhost:8080/ops/cans");

        dispatch(setCanList(response.data));
    };
};
