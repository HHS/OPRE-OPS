import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
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
            Cookies.remove("access_token", { path: "/" });
        },
        setUserDetails: (state, action) => {
            state.activeUser = action.payload;
        }
    }
});

export const { login, logout, setUserDetails } = authSlice.actions;

export default authSlice.reducer;
