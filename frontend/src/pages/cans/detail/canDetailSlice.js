import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    can: {},
};

const canDetailSlice = createSlice({
    name: "canDetail",
    initialState,
    reducers: {
        setCan: (state, action) => {
            state.can = action.payload;
        },
    },
});

export const { setCan } = canDetailSlice.actions;

export default canDetailSlice.reducer;
