import { createSlice } from "@reduxjs/toolkit";
import canDetailSlice from "../../cans/detail/canDetailSlice";

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

export const { setPortfolio } = canDetailSlice.action;

export default portfolioDetailSlice.reducer;
