import { useEffect, useReducer, useRef } from "react";
import { AGREEMENT_TYPES } from "../../ServicesComponents/ServicesComponents.constants";
import { defaultState, editAgreementReducer, initialState } from "./AgreementEditorContext.hooks";
import { AgreementEditorContext, EditAgreementDispatchContext } from "./contexts";

let modifiedInitialState = { ...initialState };

/**
 * Decorates raw budget lines with the UI-only linkage keys the editor and grouping
 * helpers expect (`grant_number_number` for grants; `services_component_number` +
 * `serviceComponentGroupingLabel` for contracts/other types), resolved by looking up
 * the BLI's persisted `grant_number_id`/`services_component_id` against the current
 * grant numbers / services components. Mirrors the equivalent read-only logic in
 * AgreementBudgetLines.jsx (kept separate — that path has no editor state to decorate).
 * @param {Array} budgetLines - The raw budget lines to decorate.
 * @param {Object} options
 * @param {boolean} options.isGrant - Whether the agreement is a grant.
 * @param {Array} options.servicesComponents - The services components to resolve against.
 * @param {Array} options.grantNumbers - The grant numbers to resolve against.
 * @returns {Array} The decorated budget lines.
 */
function decorateBudgetLinesForEditor(budgetLines, { isGrant, servicesComponents, grantNumbers }) {
    return (budgetLines ?? []).map((bli) => {
        if (isGrant) {
            const budgetLineGrantNumber = grantNumbers?.find((gn) => gn.id === bli.grant_number_id);
            return { ...bli, grant_number_number: budgetLineGrantNumber?.number ?? 0 };
        }
        const budgetLineServicesComponent = servicesComponents?.find((sc) => sc.id === bli.services_component_id);
        const serviceComponentNumber = budgetLineServicesComponent?.number ?? 0;
        const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
            ? `${serviceComponentNumber}-${budgetLineServicesComponent?.sub_component}`
            : `${serviceComponentNumber}`;
        return { ...bli, services_component_number: serviceComponentNumber, serviceComponentGroupingLabel };
    });
}

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
 * @param {Array} [props.budgetLines] - The list of budget line items associated with the agreement.
 * @param {number} [props.budgetLinesReseedKey] - Mirrors `servicesComponentsReseedKey` for budget line items.
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
    budgetLines,
    budgetLinesReseedKey = 0,
    children
}) {
    if (agreement) {
        modifiedInitialState.agreement = { ...agreement };
        modifiedInitialState.selected_project = agreement.project;
        modifiedInitialState.selected_product_service_code = agreement.product_service_code;
        modifiedInitialState.selected_procurement_shop = agreement.procurement_shop;
        modifiedInitialState.services_components = servicesComponents || [];
        modifiedInitialState.grant_numbers = grantNumbers || [];
        modifiedInitialState.budget_line_items = decorateBudgetLinesForEditor(budgetLines || [], {
            isGrant: agreement.agreement_type === AGREEMENT_TYPES.GRANT,
            servicesComponents: servicesComponents || [],
            grantNumbers: grantNumbers || []
        });
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

    // Mirrors the services_components/grant_numbers reseed pattern above, for budget line items.
    const budgetLinesRef = useRef(budgetLines);
    useEffect(() => {
        budgetLinesRef.current = budgetLines;
    }, [budgetLines]);

    const isFirstBudgetLinesReseed = useRef(true);
    useEffect(() => {
        if (isFirstBudgetLinesReseed.current) {
            isFirstBudgetLinesReseed.current = false;
            return;
        }
        dispatch({
            type: "RESEED_BUDGET_LINE_ITEMS",
            payload: decorateBudgetLinesForEditor(budgetLinesRef.current ?? [], {
                isGrant: state.agreement?.agreement_type === AGREEMENT_TYPES.GRANT,
                servicesComponents: servicesComponentsRef.current ?? [],
                grantNumbers: grantNumbersRef.current ?? []
            })
        });
        // Only re-run on an explicit reseed-key bump, not on every agreement_type change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgetLinesReseedKey]);

    return (
        <AgreementEditorContext.Provider value={state}>
            <EditAgreementDispatchContext.Provider value={dispatch}>{children}</EditAgreementDispatchContext.Provider>
        </AgreementEditorContext.Provider>
    );
}
