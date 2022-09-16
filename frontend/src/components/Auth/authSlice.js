import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        authStateToken: "",
        authCode: "",
        isLoggedIn: false,
        userDetails: null,
    },
    reducers: {
        setAuthStateToken: (state, action) => {
            state.authStateToken = action.payload;
        },
        setAuthenticationCode: (state, action) => {
            state.authCode = action.payload;
        },
        login: (state, action) => {
            state.isLoggedIn = true;
        },
        logout: (state, action) => {
            state.isLoggedIn = false;
            state.authCode = "";
            state.authStateToken = "";
            state.userDetails = null;
        },
        setUserDetails: (state, action) => {
            state.userDetails = action.payload;
        },
    },
});

export const { setAuthStateToken, setAuthenticationCode, login, logout, setUserDetails } = authSlice.actions;

export default authSlice.reducer;
