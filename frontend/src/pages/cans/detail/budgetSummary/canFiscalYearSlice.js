import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    canFiscalYearObj: {},
    pendingFunds: 0,
    selectedFiscalYear: new Date().getFullYear(),
};

const canFiscalYearSlice = createSlice({
    name: "canFiscalYearDetail",
    initialState,
    reducers: {
        setCanFiscalYear: (state, action) => {
            state.canFiscalYearObj = action.payload;
        },
        setPendingFunds: (state, action) => {
            state.pendingFunds = action.payload;
        },
        setSelectedFiscalYear: (state, action) => {
            state.selectedFiscalYear = action.payload;
        },
    },
});

export const { setCanFiscalYear, setPendingFunds, setSelectedFiscalYear } = canFiscalYearSlice.actions;

export default canFiscalYearSlice.reducer;
