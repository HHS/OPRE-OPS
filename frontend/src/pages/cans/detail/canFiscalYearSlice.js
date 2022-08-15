import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cfy: {},
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
