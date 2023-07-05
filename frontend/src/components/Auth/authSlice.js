import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
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
        },
        setUserDetails: (state, action) => {
            state.activeUser = action.payload;
        },
    },
});

export const { login, logout, setUserDetails } = authSlice.actions;

export default authSlice.reducer;
