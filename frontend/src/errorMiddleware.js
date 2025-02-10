import { isRejectedWithValue } from "@reduxjs/toolkit";
import { opsApi } from "./api/opsAPI.js";
import { logout } from "./components/Auth/authSlice.js";

let navigateFunction = null;
let isRedirecting = false; // Add a flag to prevent multiple redirects

export const setNavigate = (navigate) => {
    navigateFunction = navigate;
};

export const errorMiddleware = (store) => (next) => (action) => {
    // Check if we're already handling a redirect
    if (isRedirecting) {
        return next(action);
    }

    if (isRejectedWithValue(action) && action.payload?.status === 401) {
        try {
            isRedirecting = true; // Set the flag before starting redirect process

            // Batch our Redux actions
            Promise.resolve().then(() => {
                store.dispatch(opsApi.util.resetApiState());
                store.dispatch(logout());
            });

            // Handle navigation after a small delay
            setTimeout(() => {
                if (navigateFunction) {
                    navigateFunction("/login", { replace: true });
                } else {
                    window.location.replace("/login");
                }
                isRedirecting = false; // Reset the flag after redirect
            }, 100);
        } catch (error) {
            isRedirecting = false; // Reset the flag if there's an error
            console.error("Error during redirect:", error);
        }
    }

    return next(action);
};

export default errorMiddleware;
