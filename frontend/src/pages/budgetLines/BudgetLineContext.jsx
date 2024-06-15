import { createContext, useReducer } from "react";
import { budgetLinesReducer, initialState } from "./BudgetLineContext.hooks";

export const BudgetLinesContext = createContext(null);
export const BudgetLinesDispatchContext = createContext(null);

export function BudgetLinesProvider({ children }) {
    const [state, dispatch] = useReducer(budgetLinesReducer, initialState);

    return (
        <BudgetLinesContext.Provider value={state}>
            <BudgetLinesDispatchContext.Provider value={dispatch}>{children}</BudgetLinesDispatchContext.Provider>
        </BudgetLinesContext.Provider>
    );
}
