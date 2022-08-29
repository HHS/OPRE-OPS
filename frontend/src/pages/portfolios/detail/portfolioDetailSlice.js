import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    portfolio: {},
};

const portfolioDetailSlice = createSlice({
    name: "portfolioDetail",
    initialState,
    reducers: {
        setportfolio: (state, action) => {
            state.portfolio = action.payload;
        },
    },
});

export const { setportfolio } = portfolioDetailSlice.actions;

export default portfolioDetailSlice.reducer;
