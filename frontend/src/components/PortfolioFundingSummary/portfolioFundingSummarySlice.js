import { createSlice } from "@reduxjs/toolkit";

export const defaultPortfolioFunding = {
    total_funding: {
        amount: 0,
        label: "",
    },
    planned_funding: {
        amount: 0,
        label: "",
    },
    obligated_funding: {
        amount: 0,
        label: "",
    },
    in_execution_funding: {
        amount: 0,
        label: "",
    },
    available_funding: {
        amount: 0,
        label: "",
    },
};

const initialState = {
    portfolio: {},
    portfolioFunding: defaultPortfolioFunding,
};

const portfolioFundingSummarySlice = createSlice({
    name: "portfolioFunding",
    initialState,
    reducers: {
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
        setPortfolioFunding: (state, action) => {
            state.portfolioFunding = action.payload;
        },
    },
});

export const { setPortfolio, setPortfolioFunding } = portfolioFundingSummarySlice.actions;

export default portfolioFundingSummarySlice.reducer;
