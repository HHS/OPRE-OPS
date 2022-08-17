import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    canFiscalYearObj: {},
    selectedFiscalYear: new Date().getFullYear(),
};

const canFiscalYearSlice = createSlice({
    name: "canFiscalYearDetail",
    initialState,
    reducers: {
        setCanFiscalYear: (state, action) => {
            state.canFiscalYearObj = action.payload;
        },
        setSelectedFiscalYear: (state, action) => {
            state.selectedFiscalYear = action.payload;
        },
    },
});

export const { setCanFiscalYear, setSelectedFiscalYear } = canFiscalYearSlice.actions;

export default canFiscalYearSlice.reducer;
