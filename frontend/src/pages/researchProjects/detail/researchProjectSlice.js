import { createSlice } from "@reduxjs/toolkit";

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
