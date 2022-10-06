import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
    portfolioFunding: {},
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
