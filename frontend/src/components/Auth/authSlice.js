import {createSlice} from "@reduxjs/toolkit";
import Cookies from "js-cookie";

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
            state.isLoggedIn = false;
            state.activeUser = null;
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("activeProvider");
            Cookies.remove("access_token", {path: "/"});
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

export const {login, logout, setUserDetails, setLoginError} = authSlice.actions;

export default authSlice.reducer;
