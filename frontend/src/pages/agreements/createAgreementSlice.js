import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    current_step: 1,
    agreement_reasons_list: [],
    agreement_types_list: [],
    research_projects_list: [],
    research_projects_filter: "",
    agreement: {
        selected_agreement_type: null,
        selected_agreement_reason: null,
        name: "",
        description: "",
        selected_product_service_code: null,
        selected_incumbent: -1,
        project_officer: null,
        team_members: [],
        notes: "",
    },
    procurement_shops_list: [],
    cans: [],
    users: [],
    product_service_codes_list: [],
    locked_budget_lines: [],
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
    budget_line_being_edited: -1,
};

const createAgreementSlice = createSlice({
    name: "createAgreement",
    initialState,
    reducers: {
        setCurrentStep: (state, action) => {
            state.current_step = action.payload;
        },
        setAgreementReasonsList: (state, action) => {
            state.agreement_reasons_list = action.payload;
        },
        setAgreementTypesList: (state, action) => {
            state.agreement_types_list = action.payload;
        },
        setResearchProjectsList: (state, action) => {
            state.research_projects_list = action.payload;
        },
        setResearchProjectsFilter: (state, action) => {
            state.research_projects_filter = action.payload;
        },
        setSelectedAgreementReason: (state, action) => {
            state.agreement.selected_agreement_reason = action.payload;
        },
        setSelectedAgreementType: (state, action) => {
            state.agreement.selected_agreement_type = action.payload;
        },
        setAgreementTitle: (state, action) => {
            state.agreement.name = action.payload;
        },
        setAgreementDescription: (state, action) => {
            state.agreement.description = action.payload;
        },
        setAgreementProductServiceCode: (state, action) => {
            state.agreement.selected_product_service_code = action.payload;
        },
        setProductServiceCodesList: (state, action) => {
            state.product_service_codes_list = action.payload;
        },
        setAgreementIncumbent: (state, action) => {
            state.agreement.selected_incumbent = action.payload;
        },
        setAgreementProjectOfficer: (state, action) => {
            state.agreement.project_officer = action.payload;
        },
        setAgreementTeamMembers: (state, action) => {
            state.agreement.team_members = action.payload;
        },
        removeAgreementTeamMember: (state, action) => {
            state.agreement.team_members = state.agreement.team_members.filter(
                (team_member) => team_member.id !== action.payload
            );
        },

        setAgreementNotes: (state, action) => {
            state.agreement.notes = action.payload;
        },
        setProcurementShopsList: (state, action) => {
            state.procurement_shops_list = action.payload;
        },
        setCans: (state, action) => {
            state.cans = action.payload;
        },
        setBudgetLineAdded: (state, action) => {
            state.budget_lines_added = action.payload;
            state.is_editing_budget_line = false;
        },
        deleteBudgetLineAdded: (state, action) => {
            if (window.confirm("Are you sure you want to delete this budget line?")) {
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
            }
        },
        editBudgetLineAdded: (state, action) => {
            const index = state.budget_lines_added.findIndex((budget_line) => budget_line.id === action.payload.id);

            if (index !== -1) {
                const { line_description, comments, can_id, can_number, amount, date_needed } =
                    state.budget_lines_added[index];
                const [entered_year, entered_month, entered_day] = date_needed.split("-");

                return {
                    ...state,
                    is_editing_budget_line: true,
                    entered_description: line_description,
                    entered_comments: comments,
                    selected_can: {
                        id: can_id,
                        number: can_number,
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
                    created_on: new Date().toISOString(),
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
                    alert("Budget Line Updated");
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
        setSelectedProject: (state, action) => {
            state.selected_project = action.payload;
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
        setUsers: (state, action) => {
            state.users = action.payload;
        },
    },
});

export const {
    setCurrentStep,
    setResearchProjectsList,
    setProductServiceCodesList,
    setResearchProjectsFilter,
    setAgreements,
    setProcurementShopsList,
    setCans,
    setSelectedAgreementReason,
    setSelectedAgreementType,
    setAgreementReasonsList,
    setAgreementTypesList,
    setAgreementTitle,
    setAgreementDescription,
    setAgreementProductServiceCode,
    setAgreementIncumbent,
    setAgreementTeamMembers,
    setBudgetLineAdded,
    setAgreementProjectOfficer,
    deleteBudgetLineAdded,
    setAgreementNotes,
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
    setUsers,
    removeAgreementTeamMember,
} = createAgreementSlice.actions;

export default createAgreementSlice.reducer;
