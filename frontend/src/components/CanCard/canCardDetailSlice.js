import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    canFundingData: {},
};

const canCardDetailSlice = createSlice({
    name: "canCardDetails", // This should match what's defined in the store.js
    initialState,
    reducers: {
        setCanFundingData: (state, action) => {
            state.canFundingData = action.payload;
        },
    },
});

export const { setCanFundingData } = canCardDetailSlice.actions;

export default canCardDetailSlice.reducer;
