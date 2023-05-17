import { createContext, useContext, useReducer } from "react";

export const CreateBudgetLinesContext = createContext(null);
export const CreateBudgetLinesDispatchContext = createContext(null);

const initialState = {
    research_projects_list: [],
    research_projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    // budget_lines_added: [],
    is_editing_budget_line: false,
    // selected_project: {},
    // selected_agreement: {},
    selected_can: {},
    // selected_procurement_shop: {},
    entered_description: "",
    entered_amount: null,
    entered_month: "",
    entered_day: "",
    entered_year: "",
    entered_comments: "",
    budget_line_being_edited: -1,
    // wizardSteps: ["Project & Agreement", "Budget Lines", "Review"],
};

export function CreateBudgetLinesProvider({ children }) {
    const [state, dispatch] = useReducer(budgetLinesReducer, initialState);

    return (
        <CreateBudgetLinesContext.Provider value={state}>
            <CreateBudgetLinesDispatchContext.Provider value={dispatch}>
                {children}
            </CreateBudgetLinesDispatchContext.Provider>
        </CreateBudgetLinesContext.Provider>
    );
}

export function useBudgetLines() {
    return useContext(CreateBudgetLinesContext);
}

export function useBudgetLinesDispatch() {
    return useContext(CreateBudgetLinesDispatchContext);
}
export function useSetState(key) {
    const dispatch = useContext(CreateBudgetLinesDispatchContext);

    const setValue = (value) => {
        dispatch({ type: "SET_STATE", key, value });
    };

    return setValue;
}

function budgetLinesReducer(state, action) {
    switch (action.type) {
        case "SET_STATE": {
            return { ...state, [action.key]: action.value };
        }
        case "ADD_BUDGET_LINE": {
            return {
                ...state,
                budget_lines_added: [...state.budget_lines_added, action.payload],
                is_editing_budget_line: false,
            };
        }
        case "DELETE_BUDGET_LINE": {
            return {
                ...state,
                budget_lines_added: state.budget_lines_added.filter((bl) => bl.id !== action.id),
            };
        }
        case "SET_BUDGET_LINE_FOR_EDITING": {
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
            return state;
        }
        case "EDIT_BUDGET_LINE": {
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
            };
        }
        case "DUPLICATE_BUDGET_LINE": {
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
            return state;
        }
        case "RESET_FORM": {
            return {
                ...state,
                entered_description: "",
                entered_comments: "",
                selected_can: {},
                entered_amount: null,
                entered_month: "",
                entered_day: "",
                entered_year: "",
                budget_line_being_edited: -1,
                is_editing_budget_line: false,
            };
        }
        case "RESET_FORM_AND_BUDGET_LINES": {
            return {
                ...state,
                entered_description: "",
                entered_comments: "",
                selected_can: {},
                entered_amount: null,
                entered_month: "",
                entered_day: "",
                entered_year: "",
                budget_line_being_edited: -1,
                is_editing_budget_line: false,
                budget_lines_added: [],
                selected_agreement: {},
                selected_procurement_shop: {},
            };
        }
        case "RESET_TO_INITIAL_STATE": {
            return initialState;
        }
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
