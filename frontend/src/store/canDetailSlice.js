import { createSlice } from "@reduxjs/toolkit";
import constants from "../constants";

const initialState = {
    can: {},
    canFiscalYearObj: {},
    pendingFunds: constants.notFilledInText,
    selectedFiscalYear: new Date().getFullYear(),
};

const canDetailSlice = createSlice({
    name: "canDetail",
    initialState,
    reducers: {
        setCan: (state, action) => {
            state.can = action.payload;
        },
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

export const { setCan, setCanFiscalYear, setPendingFunds, setSelectedFiscalYear } = canDetailSlice.actions;

export default canDetailSlice.reducer;
