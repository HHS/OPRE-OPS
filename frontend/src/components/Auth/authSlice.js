import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
        activeUser: null,
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
            localStorage.removeItem("ops-state-key");
            localStorage.removeItem("activeProvider");
        },
        setUserDetails: (state, action) => {
            state.activeUser = action.payload;
        },
    },
});

export const { login, logout, setUserDetails } = authSlice.actions;

export default authSlice.reducer;
