import { createContext, useReducer } from "react";
import { editAgreementReducer, initialState, defaultState } from "./AgreementEditorContext.hooks";

export const AgreementEditorContext = createContext(null);
export const EditAgreementDispatchContext = createContext(null);

// const defaultState = {
//     agreement: {
//         id: null,
//         agreement_type: null,
//         agreement_reason: null,
//         name: "",
//         description: "",
//         product_service_code_id: null,
//         incumbent: null,
//         project_officer_id: null,
//         team_members: [],
//         notes: "",
//         project_id: null,
//         procurement_shop_id: null,
//         contract_type: null,
//         service_requirement_type: SERVICE_REQ_TYPES.NON_SEVERABLE
//     },
//     selected_project: {},
//     selected_product_service_code: {},
//     selected_procurement_shop: {},
//     selected_project_officer: {},
//     wizardSteps: ["Project", "Agreement", "Budget Lines"]
// };
// let initialState = { ...defaultState };
let modifiedInitialState = { ...initialState };

/**
 * Provides a context for creating an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to edit, if any.
 * @param {Object} props.projectOfficer - The project officer to set, if any.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The AgreementEditorContext provider.
 */
export function EditAgreementProvider({ agreement, projectOfficer, children }) {
    if (agreement) {
        modifiedInitialState.agreement = { ...agreement };
        modifiedInitialState.selected_project = agreement.project;
        modifiedInitialState.selected_product_service_code = agreement.product_service_code;
        modifiedInitialState.selected_procurement_shop = agreement.procurement_shop;
        if (projectOfficer) {
            modifiedInitialState.selected_project_officer = projectOfficer;
        }
        delete modifiedInitialState.agreement.project;
        delete modifiedInitialState.agreement.product_service_code;
        delete modifiedInitialState.agreement.procurement_shop;
        delete modifiedInitialState.agreement.status;
    } else {
        modifiedInitialState = { ...defaultState };
    }

    const [state, dispatch] = useReducer(editAgreementReducer, modifiedInitialState);

    return (
        <AgreementEditorContext.Provider value={state}>
            <EditAgreementDispatchContext.Provider value={dispatch}>{children}</EditAgreementDispatchContext.Provider>
        </AgreementEditorContext.Provider>
    );
}

// export function useEditAgreement() {
//     return useContext(AgreementEditorContext);
// }

// export function useEditAgreementDispatch() {
//     return useContext(EditAgreementDispatchContext);
// }

// export function useSetState(key) {
//     const dispatch = useContext(EditAgreementDispatchContext);

//     const setValue = (value) => {
//         dispatch({ type: "SET_STATE", key, value });
//     };

//     return setValue;
// }
// export function useUpdateAgreement(key) {
//     const dispatch = useContext(EditAgreementDispatchContext);

//     const setValue = (value) => {
//         dispatch({ type: "UPDATE_AGREEMENT", key, value });
//     };

//     return setValue;
// }

// function editAgreementReducer(state, action) {
//     switch (action.type) {
//         case "SET_STATE": {
//             return { ...state, [action.key]: action.value };
//         }
//         case "UPDATE_AGREEMENT": {
//             return {
//                 ...state,
//                 agreement: { ...state.agreement, [action.key]: action.value }
//             };
//         }
//         case "ADD_TEAM_MEMBER": {
//             return {
//                 ...state,
//                 agreement: {
//                     ...state.agreement,
//                     team_members: [...state.agreement.team_members, action.payload]
//                 }
//             };
//         }
//         case "REMOVE_TEAM_MEMBER": {
//             return {
//                 ...state,
//                 agreement: {
//                     ...state.agreement,
//                     team_members: state.agreement.team_members.filter((member) => member.id !== action.payload.id)
//                 }
//             };
//         }
//         case "RESET_TO_INITIAL_STATE": {
//             return initialState;
//         }
//         default: {
//             throw Error("Unknown action: " + action.type);
//         }
//     }
// }
