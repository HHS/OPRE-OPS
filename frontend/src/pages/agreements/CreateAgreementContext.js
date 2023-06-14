import { createContext, useContext, useReducer } from "react";

export const CreateAgreementContext = createContext(null);
export const CreateAgreementDispatchContext = createContext(null);

const defaultState = {
    agreement: {
        id: null,
        selected_agreement_type: null,
        selected_agreement_reason: null,
        name: "",
        description: "",
        selected_product_service_code: null,
        incumbent: null,
        project_officer: null,
        team_members: [],
        notes: "",
        research_project_id: null,
        procurement_shop_id: null,
    },
    selected_project: {},
    selected_procurement_shop: {},
    wizardSteps: ["Project", "Agreement", "Budget Lines"],
};
let initialState = { ...defaultState };

export function CreateAgreementProvider({ agreement, project_officer, children }) {
    if (agreement) {
        initialState.agreement = { ...agreement };
        initialState.agreement.selected_agreement_type = agreement.agreement_type;
        initialState.agreement.selected_agreement_reason = agreement.agreement_reason;
        initialState.agreement.selected_product_service_code = agreement.product_service_code;
        initialState.agreement.project_officer = project_officer ? project_officer : null;
        initialState.selected_project = agreement.research_project;
        initialState.selected_procurement_shop = agreement.procurement_shop;
    } else {
        initialState = { ...defaultState };
    }

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
export function useUpdateAgreement(key) {
    const dispatch = useContext(CreateAgreementDispatchContext);

    const setValue = (value) => {
        dispatch({ type: "UPDATE_AGREEMENT", key, value });
    };

    return setValue;
}

function createAgreementReducer(state, action) {
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
