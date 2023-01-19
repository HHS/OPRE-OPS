import { createSlice } from "@reduxjs/toolkit";
import { getCurrentFiscalYear } from "../../../helpers/utils";

const initialState = {
    researchProject: {},
};

const researchProjectSlice = createSlice({
    name: "researchProjectSlice",
    initialState,
    reducers: {
        setResearchProject: (state, action) => {
            state.researchProject = action.payload;
        },
    },
});

export const { setResearchProject } = researchProjectSlice.actions;

export default researchProjectSlice.reducer;
