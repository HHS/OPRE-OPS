import { useEffect, useReducer, useRef } from "react";
import { defaultState, editAgreementReducer, initialState } from "./AgreementEditorContext.hooks";
import { AgreementEditorContext, EditAgreementDispatchContext } from "./contexts";

let modifiedInitialState = { ...initialState };

/**
 * Provides a context for creating an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to edit, if any.
 * @param {Object} props.projectOfficer - The project officer to set, if any.
 * @param {Object} props.alternateProjectOfficer - The alternate project officer to set, if any.
 * @param {Array} props.servicesComponents - The list of service components associated with the agreement.
 * @param {number} [props.servicesComponentsReseedKey] - When this value changes, the provider reseeds
 *   `services_components` in context from the current `servicesComponents` prop. Use this to revert
 *   optimistic edits after a save failure. Avoid bumping it on routine prop changes (e.g. RTK Query
 *   tag invalidation after a successful save) — that would wipe in-progress edits.
 * @param {Array} [props.grantNumbers] - The list of grant numbers associated with the agreement (grants only).
 * @param {number} [props.grantNumbersReseedKey] - Mirrors `servicesComponentsReseedKey` for grant numbers.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The AgreementEditorContext provider.
 */
export function EditAgreementProvider({
    agreement,
    projectOfficer,
    alternateProjectOfficer,
    servicesComponents,
    servicesComponentsReseedKey = 0,
    grantNumbers,
    grantNumbersReseedKey = 0,
    children
}) {
    if (agreement) {
        modifiedInitialState.agreement = { ...agreement };
        modifiedInitialState.selected_project = agreement.project;
        modifiedInitialState.selected_product_service_code = agreement.product_service_code;
        modifiedInitialState.selected_procurement_shop = agreement.procurement_shop;
        modifiedInitialState.services_components = servicesComponents || [];
        modifiedInitialState.grant_numbers = grantNumbers || [];
        if (projectOfficer) {
            modifiedInitialState.selected_project_officer = projectOfficer;
        }
        if (alternateProjectOfficer) {
            modifiedInitialState.selected_alternate_project_officer = alternateProjectOfficer;
        }
        delete modifiedInitialState.agreement.project;
        delete modifiedInitialState.agreement.product_service_code;
        delete modifiedInitialState.agreement.status;
    } else {
        modifiedInitialState = { ...defaultState };
    }

    const [state, dispatch] = useReducer(editAgreementReducer, modifiedInitialState);

    // Reseed services_components from the latest prop only when the parent
    // explicitly bumps `servicesComponentsReseedKey` (e.g. after a save failure
    // and refetch). Watching the prop directly would reset in-progress edits on
    // any RTK Query refetch, including the one after a successful save.
    const servicesComponentsRef = useRef(servicesComponents);
    useEffect(() => {
        servicesComponentsRef.current = servicesComponents;
    }, [servicesComponents]);

    const isFirstReseed = useRef(true);
    useEffect(() => {
        if (isFirstReseed.current) {
            isFirstReseed.current = false;
            return;
        }
        dispatch({ type: "RESEED_SERVICES_COMPONENTS", payload: servicesComponentsRef.current ?? [] });
    }, [servicesComponentsReseedKey]);

    // Mirrors the services_components reseed pattern above, for grant numbers.
    const grantNumbersRef = useRef(grantNumbers);
    useEffect(() => {
        grantNumbersRef.current = grantNumbers;
    }, [grantNumbers]);

    const isFirstGrantNumbersReseed = useRef(true);
    useEffect(() => {
        if (isFirstGrantNumbersReseed.current) {
            isFirstGrantNumbersReseed.current = false;
            return;
        }
        dispatch({ type: "RESEED_GRANT_NUMBERS", payload: grantNumbersRef.current ?? [] });
    }, [grantNumbersReseedKey]);

    return (
        <AgreementEditorContext.Provider value={state}>
            <EditAgreementDispatchContext.Provider value={dispatch}>{children}</EditAgreementDispatchContext.Provider>
        </AgreementEditorContext.Provider>
    );
}
