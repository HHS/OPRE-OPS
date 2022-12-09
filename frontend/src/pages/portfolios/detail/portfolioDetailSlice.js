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
            // do not add to list if the API response is empty or if we already have the can in state
            if (
                action.payload.length !== 0 &&
                !state.portfolioCansFundingDetails.some((item) => item.can.id === action.payload.can.id)
            ) {
                state.portfolioCansFundingDetails = [...state.portfolioCansFundingDetails, action.payload];
            }
        },
    },
});

export const { setPortfolio, setPortfolioCans, setPortfolioCansFundingDetails } = portfolioDetailSlice.actions;

export default portfolioDetailSlice.reducer;
