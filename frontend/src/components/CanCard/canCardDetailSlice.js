import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    can: {},
};

const canCardDetailSlice = createSlice({
    name: "canCardDetail",
    initialState,
    reducers: {
        setCan: (state, action) => {
            state.can = action.payload;
        },
    },
});

export const { setCan } = canCardDetailSlice.actions;

export default canCardDetailSlice.reducer;
