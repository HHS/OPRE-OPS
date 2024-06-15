import { createContext, useReducer } from "react";
import { editAgreementReducer, initialState, defaultState } from "./AgreementEditorContext.hooks";

export const AgreementEditorContext = createContext(null);
export const EditAgreementDispatchContext = createContext(null);

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
