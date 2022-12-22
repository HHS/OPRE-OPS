import { createSlice } from "@reduxjs/toolkit";
import { getCurrentFiscalYear } from "../helpers/utils";

const initialState = {
    portfolio: {},
    portfolioCans: [],
    portfolioCansFundingDetails: [],
    selectedFiscalYear: { value: getCurrentFiscalYear(new Date()) },
};

const portfolioSlice = createSlice({
    name: "portfolioSlice",
    initialState,
    reducers: {
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
        setPortfolioCans: (state, action) => {
            state.portfolioCans = action.payload;
        },
        setPortfolioCansFundingDetails: (state, action) => {
            state.portfolioCansFundingDetails = action.payload;
        },
        setSelectedFiscalYear: (state, action) => {
            state.selectedFiscalYear = action.payload;
        },
    },
});

export const { setSelectedFiscalYear, setPortfolio, setPortfolioCans, setPortfolioCansFundingDetails } =
    portfolioSlice.actions;

export default portfolioSlice.reducer;
