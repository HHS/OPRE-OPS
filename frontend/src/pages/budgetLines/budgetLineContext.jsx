import { createContext, useContext, useReducer } from "react";

export const BudgetLinesContext = createContext(null);
export const BudgetLinesDispatchContext = createContext(null);

const initialState = {
    research_projects_list: [],
    research_projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    existing_budget_lines: [],
    selected_project: {},
    selected_agreement: {},
    selected_can: {},
    selected_procurement_shop: {},
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
            return { ...state, [action.key]: action.value };
        }
        case "RESET_TO_INITIAL_STATE": {
            return initialState;
        }
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
