import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
};

const portfolioDetailSlice = createSlice({
    name: "portfolioDetail",
    initialState,
    reducers: {
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
    },
});

export const { setPortfolio } = portfolioDetailSlice.actions;

export default portfolioDetailSlice.reducer;
