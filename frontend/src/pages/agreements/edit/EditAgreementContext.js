import { createContext, useContext, useReducer } from "react";

export const EditAgreementContext = createContext(null);
export const EditAgreementDispatchContext = createContext(null);

const initialState = {
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
    // selected_project: {},
    selected_procurement_shop: {},
    // wizardSteps: ["Project", "Agreement", "Budget Lines"],
};

export function EditAgreementProvider({ children }) {
    const [state, dispatch] = useReducer(EditAgreementReducer, initialState);

    return (
        <EditAgreementContext.Provider value={state}>
            <EditAgreementDispatchContext.Provider value={dispatch}>
                {children}
            </EditAgreementDispatchContext.Provider>
        </EditAgreementContext.Provider>
    );
}

export function useEditAgreement() {
    return useContext(EditAgreementContext);
}

export function useEditAgreementDispatch() {
    return useContext(EditAgreementDispatchContext);
}
export function useSetState(key) {
    const dispatch = useContext(EditAgreementDispatchContext);

    const setValue = (value) => {
        dispatch({ type: "SET_STATE", key, value });
    };

    return setValue;
}
export function useUpdateAgreement(key) {
    const dispatch = useContext(EditAgreementDispatchContext);

    const setValue = (value) => {
        dispatch({ type: "UPDATE_AGREEMENT", key, value });
    };

    return setValue;
}

function EditAgreementReducer(state, action) {
    switch (action.type) {
        case "SET_STATE": {
            return { ...state, [action.key]: action.value };
        }
        case "UPDATE_AGREEMENT": {
            return {
                ...state,
                agreement: { ...state.agreement, [action.key]: action.value },
            };
        }
        case "ADD_TEAM_MEMBER": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    team_members: [...state.agreement.team_members, action.payload],
                },
            };
        }
        case "REMOVE_TEAM_MEMBER": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    team_members: state.agreement.team_members.filter((member) => member.id !== action.payload.id),
                },
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
