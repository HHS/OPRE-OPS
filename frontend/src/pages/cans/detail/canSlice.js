import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    can: {},
};

const canSlice = createSlice({
    name: "can",
    initialState,
    reducers: {
        setCan: (state, action) => {
            state.can = action.payload;
        },
    },
});

export const { setCan } = canSlice.actions;

export default canSlice.reducer;
