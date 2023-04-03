import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    current_step: 1,
    research_projects: [],
    research_projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    budget_lines_added: [],
    is_editing_budget_line: false,
    selected_project: -1,
    selected_agreement: -1,
    selected_can: -1,
    selected_procurement_shop: -1,
    entered_description: "",
    entered_amount: null,
    entered_month: "",
    entered_day: "",
    entered_year: "",
    entered_comments: "",
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
        deleteBudgetLineAdded: (state, action) => {
            state.budget_lines_added = state.budget_lines_added.filter(
                (budget_line) => budget_line.id !== action.payload
            );
        },
        editBudgetLineAdded: (state, action) => {
            const index = state.budget_lines_added.findIndex((budget_line) => budget_line.id === action.payload.id);
            console.log(`index is ${index}`);
            state.is_editing_budget_line = true;
            if (index !== -1) {
                // state.entered_description = state.budget_lines_added[index].line_description;
                // state.entered_comments = state.budget_lines_added[index].comments;
                // state.selected_can = state.budget_lines_added[index].can_id;
                // state.selected_agreement = state.budget_lines_added[index].agreement_id;
                // state.entered_amount = state.budget_lines_added[index].amount;
                // state.entered_month = state.budget_lines_added[index].date_needed.split("-")[1];
                // state.entered_day = state.budget_lines_added[index].date_needed.split("-")[2];
                // state.entered_year = state.budget_lines_added[index].date_needed.split("-")[0];
                const { line_description, comments, can_id, agreement_id, amount, date_needed } =
                    state.budget_lines_added[index];
                const [entered_year, entered_month, entered_day] = date_needed.split("-");

                Object.assign(state, {
                    entered_description: line_description,
                    entered_comments: comments,
                    selected_can: can_id,
                    selected_agreement: agreement_id,
                    entered_amount: amount,
                    entered_month,
                    entered_day,
                    entered_year,
                });
            }
        },
        setIsEditingBudgetLine: (state, action) => {
            state.is_editing_budget_line = action.payload;
        },
        setEditBudgetLineAdded: (state, action) => {
            const index = state.budget_lines_added.findIndex((budget_line) => budget_line.id === action.payload.id);
            console.log(`editing index is ${index}`);
            // payload is the budget line that is being edited
            //     id: budgetLinesAdded[0].id,
            //     line_description: enteredDescription,
            //     comments: enteredComments,
            //     can_id: selectedCan?.id,
            //     can_number: selectedCan?.number,
            //     agreement_id: selectedAgreement?.id,
            //     amount: enteredAmount,
            //     date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}`,
            //     psc_fee_amount: selectedProcurementShop?.fee,

            if (index !== -1) {
                const newBudgetLineItem = { ...state.budget_lines_added[index] };
                newBudgetLineItem.line_description = state.entered_description;
                newBudgetLineItem.comments = state.entered_comments;
                newBudgetLineItem.can_id = state.selected_can;
                newBudgetLineItem.amount = state.entered_amount;
                newBudgetLineItem.date_needed = `${state.entered_year}-${state.entered_month}-${state.entered_day}`;
                newBudgetLineItem.status = "DRAFT";
                state.budget_lines_added[index] = newBudgetLineItem;

                alert("edited can");
                // reset all the fields
                state.is_editing_budget_line = false;
                state.entered_description = "";
                state.entered_comments = "";
                state.selected_can = -1;
                state.entered_amount = null;
                state.entered_month = "";
                state.entered_day = "";
                state.entered_year = "";
            }
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
    setResearchProjects,
    setResearchProjectsFilter,
    setAgreements,
    setProcurementShop,
    setCan,
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
    setIsEditingBudgetLine,
    setEditBudgetLineAdded,
} = createBudgetLineSlice.actions;

export default createBudgetLineSlice.reducer;
