import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
    portfolioCans: [{}],
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
    },
});

export const { setPortfolio, setPortfolioCans } = portfolioDetailSlice.actions;

export default portfolioDetailSlice.reducer;
