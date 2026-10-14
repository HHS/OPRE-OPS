import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { invalidateVisitClassification } from "../../helpers/visitSessionCache.helpers";

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
        loginError: {
            hasError: false,
            loginErrorType: null
        },
        activeUser: null
    },
    reducers: {
        login: (state) => {
            state.isLoggedIn = true;
        },
        logout: (state) => {
            // Capture before clearing: invalidate just this user's cached first/returning
            // welcome-message classification so a same-tab relogin (no reload) re-reads
            // localStorage fresh instead of reusing a stale value from earlier this session.
            const loggedOutUserId = state.activeUser?.id;
            state.isLoggedIn = false;
            state.activeUser = null;
            if (loggedOutUserId != null) {
                invalidateVisitClassification(loggedOutUserId);
            }
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("activeProvider");
            // Intentionally keep `hasVisited_<userId>` markers so returning users
            // still see the "Welcome back" greeting after a logout/login cycle.
            Cookies.remove("access_token", { path: "/" });
        },
        setUserDetails: (state, action) => {
            state.activeUser = action.payload;
        },
        setLoginError: (state, action) => {
            state.loginError.hasError = action.payload.hasError;
            state.loginError.loginErrorType = action.payload.loginErrorType || null;
        }
    }
});

export const { login, logout, setUserDetails, setLoginError } = authSlice.actions;

export default authSlice.reducer;
