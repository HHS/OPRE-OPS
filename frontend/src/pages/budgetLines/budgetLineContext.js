// inspired by https://codesandbox.io/s/ww49ef?file=/TasksContext.js
import { createContext, useContext, useReducer } from "react";

export const BudgetLinesContext = createContext(null);
export const BudgetLinesDispatchContext = createContext(null);

const initialState = {
    research_projects_list: [],
    research_projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    budget_lines_added: [],
    is_editing_budget_line: false,
    selected_project: {},
    selected_agreement: {},
    selected_can: {},
    selected_procurement_shop: {},
    entered_description: "",
    entered_amount: null,
    entered_month: "",
    entered_day: "",
    entered_year: "",
    entered_comments: "",
    budget_line_being_edited: -1,
    wizardSteps: ["Project & Agreement", "Budget Lines", "Review"],
};

export function BudgetLinesProvider({ children }) {
    const [state, dispatch] = useReducer(budgetLinesReducer, initialState);

    return (
        <BudgetLinesContext.Provider value={state}>
            <BudgetLinesDispatchContext.Provider value={dispatch}>{children}</BudgetLinesDispatchContext.Provider>
        </BudgetLinesContext.Provider>
    );
}

export function useBudgetLines() {
    return useContext(BudgetLinesContext);
}

export function useBudgetLinesDispatch() {
    return useContext(BudgetLinesDispatchContext);
}
export function useSetState(key) {
    const dispatch = useContext(BudgetLinesDispatchContext);

    const setValue = (value) => {
        dispatch({ type: "SET_STATE", key, value });
    };

    return setValue;
}

function budgetLinesReducer(state, action) {
    switch (action.type) {
        case "SET_STATE": {
            // console.dir(`payload is ${JSON.stringify(action, null, 2)}`);
            return { ...state, [action.key]: action.value };
        }
        case "ADD_BUDGET_LINE": {
            // console.dir(`payload is ${JSON.stringify(action, null, 2)}`);
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
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
