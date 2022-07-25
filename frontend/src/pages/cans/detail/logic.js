import { setCan } from "./canSlice";
import axios from "axios";

export const getCan = (id) => {
    return async (dispatch, getState) => {
        const response = await axios.get(`http://localhost:8080/ops/cans/${id}`);

        dispatch(setCan(response.data));
    };
};
