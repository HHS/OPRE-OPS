import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolios: [],
};

const portfolioListSlice = createSlice({
    name: "portfolioList",
    initialState,
    reducers: {
        setPortfolioList: (state, action) => {
            state.portfolios = action.payload;
        },
    },
});

export const { setPortfolioList } = portfolioListSlice.actions;

export default portfolioListSlice.reducer;
