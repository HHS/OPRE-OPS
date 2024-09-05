import { isRejected } from "@reduxjs/toolkit";
import { opsApi } from "./api/opsAPI.js";
import store from "./store.js";
import { logout } from "./components/Auth/authSlice.js";

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (api) => (next) => (action) => {
    if (isRejected(action)) {
        if (action.payload?.status === 401) {
            store.dispatch(opsApi.util.resetApiState());
            store.dispatch(logout());
        }
    }

    return next(action);
};

export default errorMiddleware;
