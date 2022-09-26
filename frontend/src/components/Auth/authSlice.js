import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
        userDetails: null,
    },
    reducers: {
        login: (state, action) => {
            state.isLoggedIn = true;
        },
        logout: (state, action) => {
            state.isLoggedIn = false;
            state.userDetails = null;
        },
        setUserDetails: (state, action) => {
            state.userDetails = action.payload;
        },
    },
});

export const { login, logout, setUserDetails } = authSlice.actions;

export default authSlice.reducer;
