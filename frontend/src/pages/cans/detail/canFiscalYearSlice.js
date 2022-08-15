import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    canFiscalYear: {},
};

const canFiscalYearSlice = createSlice({
    name: "canFiscalYearDetail",
    initialState,
    reducers: {
        setCanFiscalYear: (state, action) => {
            state.canFiscalYear = action.payload;
        },
    },
});

export const { setCanFiscalYear } = canFiscalYearSlice.actions;

export default canFiscalYearSlice.reducer;
