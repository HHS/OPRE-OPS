import { createSlice } from "@reduxjs/toolkit";
import { getCurrentFiscalYear } from "../helpers/utils";

const initialState = {
    selectedFiscalYear: { value: getCurrentFiscalYear(new Date()) },
};

const portfolioSlice = createSlice({
    name: "portfolioSlice",
    initialState,
    reducers: {
        setSelectedFiscalYear: (state, action) => {
            state.selectedFiscalYear = action.payload;
        },
    },
});

export const { setSelectedFiscalYear } = portfolioSlice.actions;

export default portfolioSlice.reducer;
