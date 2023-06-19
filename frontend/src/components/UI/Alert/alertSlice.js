import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    type: "",
    heading: "",
    message: "",
    isActive: false,
    redirectUrl: "",
};

const alertSlice = createSlice({
    name: "alert",
    initialState,
    reducers: {
        setAlert: (state, action) => {
            state.type = action.payload.type;
            state.heading = action.payload.heading;
            state.message = action.payload.message;
            state.redirectUrl = action.payload.redirectUrl;
            state.isActive = true;
        },
        setIsActive: (state, action) => {
            state.isActive = action.payload;
        },
        clearState: () => {
            return initialState;
        },
    },
});

export const { setAlert, setIsActive, clearState } = alertSlice.actions;

export default alertSlice.reducer;
