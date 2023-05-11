// inspired by https://codesandbox.io/s/ww49ef?file=/TasksContext.js
import { createContext, useContext, useReducer, useState } from "react";

export const BudgetLinesContext = createContext(null);
export const BudgetLinesDispatchContext = createContext(null);

export function BudgetLinesProvider({ children }) {
    const [dispatch] = useReducer(budgetLinesReducer);
    const wizardSteps = ["Project & Agreement", "Budget Lines", "Review"];
    const [selectedProject, setSelectedProject] = useState({});
    const [selectedAgreement, setSelectedAgreement] = useState({});
    const [selectedProcurementShop, setSelectedProcurementShop] = useState({});
    const [budgetLinesAdded, setBudgetLinesAdded] = useState([{}]);

    return (
        <BudgetLinesContext.Provider
            value={{
                wizardSteps,
                selectedProject,
                setSelectedProject,
                selectedAgreement,
                setSelectedAgreement,
                selectedProcurementShop,
                setSelectedProcurementShop,
                budgetLinesAdded,
                setBudgetLinesAdded,
            }}
        >
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

function budgetLinesReducer(budgetLines, action) {
    switch (action.type) {
        case "added": {
            return [
                ...budgetLines,
                {
                    id: action.id,
                    text: action.text,
                    done: false,
                },
            ];
        }
        case "changed": {
            return budgetLines.map((t) => {
                if (t.id === action.task.id) {
                    return action.task;
                } else {
                    return t;
                }
            });
        }
        case "deleted": {
            return budgetLines.filter((t) => t.id !== action.id);
        }
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
