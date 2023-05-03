import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    project: {
        id: null,
        title: "",
        short_title: "",
        description: "",
    },
};

const createProjectSlice = createSlice({
    name: "createProject",
    initialState,
    reducers: {
        setProjectId: (state, action) => {
            state.project.id = action.payload;
        },
        setProjectTitle: (state, action) => {
            state.project.title = action.payload;
        },
        setProjectShortTitle: (state, action) => {
            state.project.short_title = action.payload;
        },
        setProjectDescription: (state, action) => {
            state.project.description = action.payload;
        },
    },
});

export const { setProjectId, setProjectTitle, setProjectShortTitle, setProjectDescription } =
    createProjectSlice.actions;

export default createProjectSlice.reducer;
