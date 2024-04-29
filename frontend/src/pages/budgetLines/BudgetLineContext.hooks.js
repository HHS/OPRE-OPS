import { useContext } from "react";
import { BudgetLinesDispatchContext, BudgetLinesContext } from "./BudgetLineContext.jsx";

export const initialState = {
    projects_list: [],
    projects_filter: "",
    agreements: [],
    procurement_shops: [],
    cans: [],
    existing_budget_lines: [],
    selected_project: {},
    selected_agreement: {},
    selected_can: {},
    selected_procurement_shop: {},
    wizardSteps: ["Project & Agreement", "Budget Lines", "Review"]
};

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

export function budgetLinesReducer(state, action) {
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
