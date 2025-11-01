import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isActive: false,
    type: "",
    heading: "",
    message: "",
    redirectUrl: "",
    isCloseable: true
};

const alertSlice = createSlice({
    name: "alert",
    initialState,
    reducers: {
        setAlert: (state, action) => {
            state.isActive = true;
            state.type = action.payload.type;
            state.heading = action.payload.heading;
            state.message = action.payload.message;
            state.redirectUrl = action.payload.redirectUrl;
            state.isCloseable = action.payload.isCloseable ?? true;
        },
        setIsActive: (state, action) => {
            state.isActive = action.payload;
        },
        clearState: () => {
            return initialState;
        }
    }
});

export const { setAlert, setIsActive, clearState } = alertSlice.actions;

export default alertSlice.reducer;
