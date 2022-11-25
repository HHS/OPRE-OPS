import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    canTotalFunding: {},
};

const canCardDetailSlice = createSlice({
    name: "canCardDetails", // This should match what's defined in the store.js
    initialState,
    reducers: {
        setCanTotalFunding: (state, action) => {
            state.canTotalFunding = action.payload;
        },
    },
});

export const { setCanTotalFunding } = canCardDetailSlice.actions;

export default canCardDetailSlice.reducer;
