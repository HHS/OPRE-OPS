import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
};

const portfolioFundingSummarySlice = createSlice({
    name: "portfolioFunding",
    initialState,
    reducers: {
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
    },
});

export const { setPortfolio } = portfolioFundingSummarySlice.actions;

export default portfolioFundingSummarySlice.reducer;
