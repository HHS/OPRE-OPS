import { createContext, useContext, useReducer } from "react";

export const CreateAgreementContext = createContext(null);
export const CreateAgreementDispatchContext = createContext(null);

const initialState = {
    agreement_reasons_list: [],
    agreement_types_list: [],
    research_projects_list: [],
    research_projects_filter: "",
    agreement: {
        id: null,
        selected_agreement_type: null,
        selected_agreement_reason: null,
        name: "",
        description: "",
        selected_product_service_code: null,
        incumbent_entered: null,
        project_officer: null,
        team_members: [],
        notes: "",
        research_project_id: null,
        procurement_shop_id: null,
    },
    cans: [],
    users: [],
    product_service_codes_list: [],
    locked_budget_lines: [],
    budget_lines_added: [],
    selected_project: {},
    selected_agreement: {},
    wizardSteps: ["Project", "Agreement", "Budget Lines"],
};

export function CreateAgreementProvider({ children }) {
    const [state, dispatch] = useReducer(createAgreementReducer, initialState);

    return (
        <CreateAgreementContext.Provider value={state}>
            <CreateAgreementDispatchContext.Provider value={dispatch}>
                {children}
            </CreateAgreementDispatchContext.Provider>
        </CreateAgreementContext.Provider>
    );
}

export function useCreateAgreement() {
    return useContext(CreateAgreementContext);
}

export function useCreateAgreementDispatch() {
    return useContext(CreateAgreementDispatchContext);
}
export function useSetState(key) {
    const dispatch = useContext(CreateAgreementDispatchContext);

    const setValue = (value) => {
        dispatch({ type: "SET_STATE", key, value });
    };

    return setValue;
}

function createAgreementReducer(state, action) {
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
