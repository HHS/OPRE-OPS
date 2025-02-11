import { isRejected } from "@reduxjs/toolkit";
import { logout } from "./components/Auth/authSlice.js";
import store from "./store.js";

export const innerIsRejected = (action) => isRejected(action) || action.type === "REJECTED";

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (api) => (next) => (action) => {
    if (innerIsRejected(action)) {
        if (action.payload?.status === 401) {
            store.dispatch(logout());
        }
    }

    return next(action);
};

export default errorMiddleware;
