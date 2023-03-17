import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    current_step: 1,
    research_projects: [],
    research_projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    budget_lines_added: [],
    selected_project: -1,
    selected_agreement: -1,
    selected_can: -1,
    selected_procurement_shop: -1,
};

const createBudgetLineSlice = createSlice({
    name: "createBudgetLine",
    initialState,
    reducers: {
        setCurrentStep: (state, action) => {
            state.current_step = action.payload;
        },
        setResearchProjects: (state, action) => {
            state.research_projects = action.payload;
        },
        setResearchProjectsFilter: (state, action) => {
            state.research_projects_filter = action.payload;
        },
        setAgreements: (state, action) => {
            state.agreements = action.payload;
        },
        setProcurementShop: (state, action) => {
            state.procurement_shops = action.payload;
        },
        setCan: (state, action) => {
            state.cans = action.payload;
        },
        setBudgetLineAdded: (state, action) => {
            state.budget_lines_added = action.payload;
        },
        setSelectedProject: (state, action) => {
            state.selected_project = action.payload;
        },
        setSelectedAgreement: (state, action) => {
            state.selected_agreement = action.payload;
        },
        setSelectedCan: (state, action) => {
            state.selected_can = action.payload;
        },
        setSelectedProcurementShop: (state, action) => {
            state.selected_procurement_shop = action.payload;
        },
    },
});

export const {
    setCurrentStep,
    setResearchProjects,
    setResearchProjectsFilter,
    setAgreements,
    setProcurementShop,
    setCan,
    setBudgetLineAdded,
    setSelectedProject,
    setSelectedAgreement,
    setSelectedCan,
    setSelectedProcurementShop,
} = createBudgetLineSlice.actions;

export default createBudgetLineSlice.reducer;
