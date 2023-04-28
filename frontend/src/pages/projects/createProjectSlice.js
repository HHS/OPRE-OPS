import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    project_types_list: [],
    project: {
        id: null,
        selected_project_type: null,
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
        setProjectTypesList: (state, action) => {
            state.project_types_list = action.payload;
        },
        setSelectedProjectType: (state, action) => {
            state.project.selected_project_type = action.payload;
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

export const {
    setProjectId,
    setProjectTypesList,
    setSelectedProjectType,
    setProjectTitle,
    setProjectShortTitle,
    setProjectDescription,
} = createProjectSlice.actions;

export default createProjectSlice.reducer;
