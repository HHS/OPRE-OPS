import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
    portfolioCans: [{}],
    portfolioCansFundingDetails: [],
};

const portfolioDetailSlice = createSlice({
    name: "portfolioDetail",
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
    },
});

export const { setPortfolio, setPortfolioCans, setPortfolioCansFundingDetails } = portfolioDetailSlice.actions;

export default portfolioDetailSlice.reducer;
