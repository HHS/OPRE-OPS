import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    current_step: 1,
    research_projects_list: [],
    research_projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    budget_lines_added: [],
    is_editing_budget_line: false,
    // selected_project: {},
    // selected_agreement: -1,
    selected_can: -1,
    selected_procurement_shop: -1,
    entered_description: "",
    entered_amount: null,
    entered_month: "",
    entered_day: "",
    entered_year: "",
    entered_comments: "",
    budget_line_being_edited: -1,
};

const createBudgetLineSlice = createSlice({
    name: "createBudgetLine",
    initialState,
    reducers: {
        setCurrentStep: (state, action) => {
            state.current_step = action.payload;
        },
        setResearchProjectsList: (state, action) => {
            state.research_projects_list = action.payload;
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
        setCans: (state, action) => {
            state.cans = action.payload;
        },
        setBudgetLineAdded: (state, action) => {
            state.budget_lines_added = action.payload;
            state.is_editing_budget_line = false;
        },
        deleteBudgetLineAdded: (state, action) => {
            state.budget_lines_added = state.budget_lines_added.filter(
                (budget_line) => budget_line.id !== action.payload
            );
            // reset the form
            state.entered_description = "";
            state.entered_comments = "";
            state.selected_can = -1;
            state.entered_amount = null;
            state.entered_month = "";
            state.entered_day = "";
            state.entered_year = "";
            state.budget_line_being_edited = -1;
            state.is_editing_budget_line = false;
        },
        editBudgetLineAdded: (state, action) => {
            const index = state.budget_lines_added.findIndex((budget_line) => budget_line.id === action.payload.id);

            if (index !== -1) {
                const { line_description, comments, can, amount, date_needed } = state.budget_lines_added[index];
                const [entered_year, entered_month, entered_day] = date_needed.split("-").map((d) => parseInt(d, 10));

                return {
                    ...state,
                    is_editing_budget_line: true,
                    entered_description: line_description,
                    entered_comments: comments,
                    selected_can: {
                        ...can,
                    },
                    entered_amount: amount,
                    entered_month,
                    entered_day,
                    entered_year,
                    budget_line_being_edited: index,
                };
            }
        },
        duplicateBudgetLineAdded: (state, action) => {
            const index = state.budget_lines_added.findIndex((budget_line) => budget_line.id === action.payload.id);

            if (index !== -1) {
                const duplicatedLine = {
                    ...action.payload,
                    id: crypto.getRandomValues(new Uint32Array(1))[0],
                    status: "DRAFT",
                };

                return {
                    ...state,
                    budget_lines_added: [...state.budget_lines_added, duplicatedLine],
                };
            }
        },
        setEditBudgetLineAdded: (state, action) => {
            const updatedBudgetLines = state.budget_lines_added.map((budgetLine) => {
                if (budgetLine.id === action.payload.id) {
                    return {
                        ...budgetLine,
                        ...action.payload,
                    };
                }
                return budgetLine;
            });

            return {
                ...state,
                budget_lines_added: updatedBudgetLines,
                is_editing_budget_line: false,
                entered_description: "",
                entered_comments: "",
                selected_can: -1,
                entered_amount: null,
                entered_month: "",
                entered_day: "",
                entered_year: "",
                budget_line_being_edited: -1,
            };
        },
        // setSelectedProject: (state, action) => {
        //     state.selected_project = action.payload;
        // },
        // setSelectedAgreement: (state, action) => {
        //     state.selected_agreement = action.payload;
        // },
        setSelectedCan: (state, action) => {
            state.selected_can = action.payload;
        },
        setSelectedProcurementShop: (state, action) => {
            state.selected_procurement_shop = action.payload;
        },
        setEnteredDescription: (state, action) => {
            state.entered_description = action.payload;
        },
        setEnteredAmount: (state, action) => {
            state.entered_amount = action.payload;
        },
        setEnteredMonth: (state, action) => {
            state.entered_month = action.payload;
        },
        setEnteredDay: (state, action) => {
            state.entered_day = action.payload;
        },
        setEnteredYear: (state, action) => {
            state.entered_year = action.payload;
        },
        setEnteredComments: (state, action) => {
            state.entered_comments = action.payload;
        },
    },
});

export const {
    setCurrentStep,
    setResearchProjectsList,
    setResearchProjectsFilter,
    setAgreements,
    setProcurementShop,
    setCans,
    setBudgetLineAdded,
    deleteBudgetLineAdded,
    editBudgetLineAdded,
    setSelectedProject,
    setSelectedAgreement,
    setSelectedCan,
    setSelectedProcurementShop,
    setEnteredDescription,
    setEnteredAmount,
    setEnteredMonth,
    setEnteredDay,
    setEnteredYear,
    setEnteredComments,
    setEditBudgetLineAdded,
    updateBudgetLineAtIndex,
    duplicateBudgetLineAdded,
} = createBudgetLineSlice.actions;

export default createBudgetLineSlice.reducer;
