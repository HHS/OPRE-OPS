import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
    budgetLineItems: [],
    totalFunding: 0,
};

const portfolioFundingSummarySlice = createSlice({
    name: "portfolioFunding",
    initialState,
    reducers: {
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
        setBudgetLineItems: (state, action) => {
            state.budgetLineItems = action.payload;
        },
        setTotalFunding: (state, action) => {
            state.totalFunding = action.payload;
        },
    },
});

export const { setPortfolio, setBudgetLineItems, setTotalFunding } = portfolioFundingSummarySlice.actions;

export default portfolioFundingSummarySlice.reducer;
