import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cfy: {},
};

const canFiscalYearSlice = createSlice({
    name: "cfyDetail",
    initialState,
    reducers: {
        setCfy: (state, action) => {
            state.cfy = action.payload;
        },
    },
});

export const { setCfy } = canFiscalYearSlice.actions;

export default canFiscalYearSlice.reducer;
