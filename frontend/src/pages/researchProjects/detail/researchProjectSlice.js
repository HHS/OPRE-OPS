import { createSlice } from "@reduxjs/toolkit";
import { getCurrentFiscalYear } from "../../../helpers/utils";

const initialState = {
    researchProject: {},
    portfolio: {},
};

const researchProjectSlice = createSlice({
    name: "researchProjectSlice",
    initialState,
    reducers: {
        setResearchProject: (state, action) => {
            state.researchProject = action.payload;
        },
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
    },
});

export const { setResearchProject, setPortfolio } = researchProjectSlice.actions;

export default researchProjectSlice.reducer;
