import { createContext, useContext, useReducer } from "react";
export const CreateAgreementContext = createContext(null);
export const CreateAgreementDispatchContext = createContext(null);

const defaultState = {
    agreement: {
        id: null,
        agreement_type: null,
        agreement_reason: null,
        name: "",
        description: "",
        product_service_code_id: null,
        incumbent: null,
        project_officer: null, // this is the ID
        team_members: [],
        notes: "",
        research_project_id: null,
        procurement_shop_id: null,
    },
    selected_project: {},
    selected_product_service_code: {},
    selected_procurement_shop: {},
    selected_project_officer: {},
    wizardSteps: ["Project", "Agreement", "Budget Lines"],
};
let initialState = { ...defaultState };

/**
 * Provides a context for creating an agreement.
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to edit, if any.
 * @param {Object} props.projectOfficer - The project officer to set, if any.
 * @param {ReactNode} props.children - The child components.
 * @returns {ReactNode} The rendered component.
 */
export function CreateAgreementProvider({ agreement, projectOfficer, children }) {
    if (agreement) {
        initialState.agreement = { ...agreement };
        initialState.selected_project = agreement.research_project;
        initialState.selected_product_service_code = agreement.product_service_code;
        initialState.selected_procurement_shop = agreement.procurement_shop;
        if (projectOfficer) {
            initialState.selected_project_officer = projectOfficer;
        }
        delete initialState.agreement.research_project;
        delete initialState.agreement.product_service_code;
        delete initialState.agreement.procurement_shop;
        delete initialState.agreement.status;
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
