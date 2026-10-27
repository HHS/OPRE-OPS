import { useContext } from "react";
import { AGREEMENT_TYPES, SERVICE_REQ_TYPES } from "../../ServicesComponents/ServicesComponents.constants";
import { AgreementEditorContext, EditAgreementDispatchContext } from "./contexts";

const defaultProcurementShop = {
    abbr: "GCS",
    fee_percentage: 0,
    id: 2,
    name: "Government Contracting Services"
};

export const defaultState = {
    agreement: {
        id: undefined,
        agreement_type: AGREEMENT_TYPES.CONTRACT,
        agreement_reason: undefined,
        name: "",
        nick_name: undefined,
        description: "",
        product_service_code_id: undefined,
        vendor: undefined,
        project_officer_id: undefined,
        alternate_project_officer_id: undefined,
        team_members: [],
        notes: "",
        project_id: undefined,
        awarding_entity_id: defaultProcurementShop.id,
        contract_type: undefined,
        service_requirement_type: SERVICE_REQ_TYPES.NON_SEVERABLE,
        research_methodologies: [],
        special_topics: [],
        aln_numbers: []
    },
    selected_agreement_id: undefined,
    selected_research_project: {},
    selected_project: {},
    selected_product_service_code: {},
    selected_procurement_shop: defaultProcurementShop,
    selected_project_officer: {},
    selected_alternate_project_officer: {},
    wizardSteps: ["Project", "Agreement", "Budget Lines"],
    services_components: [],
    deleted_services_components_ids: [],
    grant_numbers: [],
    deleted_grant_numbers_ids: [],
    budget_line_items: [],
    deleted_budget_line_items_ids: []
};
export let initialState = { ...defaultState };

const clearBliServiceComponentLink = (bli) => ({
    ...bli,
    services_component_id: null,
    services_component_number: 0,
    serviceComponentGroupingLabel: "0"
});

const clearBliGrantNumberLink = (bli) => ({
    ...bli,
    grant_number_id: null,
    grant_number_number: 0
});

const reconcileBudgetLines = (budgetLineItems, shouldClear, clearLink) =>
    budgetLineItems.map((bli) => (shouldClear(bli) ? clearLink(bli) : bli));

// Services components and grant numbers are added/updated/deleted identically — same shape,
// only the state key (and, for delete, the BLI link field to reconcile) differs. These factories
// produce the case handlers below so that shared logic isn't hand-duplicated per type.
const makeAddCase = (stateKey) => (state, action) => ({
    ...state,
    [stateKey]: [...state[stateKey], action.payload]
});

const makeUpdateCase = (stateKey) => (state, action) => ({
    ...state,
    [stateKey]: state[stateKey].map((item) => (item.number === action.payload.number ? action.payload : item))
});

const makeDeleteCase =
    ({ stateKey, deletedIdsKey, linkField, clearLink }) =>
    (state, action) => {
        const remainingIds = new Set(
            state[stateKey]
                .filter((item) => item.number !== action.payload.number)
                .map((item) => item.id)
                .filter(Boolean)
        );
        return {
            ...state,
            [stateKey]: state[stateKey].filter((item) => item.number !== action.payload.number),
            [deletedIdsKey]: action.payload.id
                ? [...state[deletedIdsKey], action.payload.id]
                : [...state[deletedIdsKey]],
            // Reconcile BLIs: clear the link to the deleted item by id so entries sharing a
            // number (e.g. SC sub-components) don't incorrectly retain a stale link.
            budget_line_items: reconcileBudgetLines(
                state.budget_line_items,
                (bli) => bli[linkField] != null && !remainingIds.has(bli[linkField]),
                clearLink
            )
        };
    };

const addServicesComponent = makeAddCase("services_components");
const updateServicesComponent = makeUpdateCase("services_components");
const deleteServiceComponent = makeDeleteCase({
    stateKey: "services_components",
    deletedIdsKey: "deleted_services_components_ids",
    linkField: "services_component_id",
    clearLink: clearBliServiceComponentLink
});

const addGrantNumber = makeAddCase("grant_numbers");
const updateGrantNumber = makeUpdateCase("grant_numbers");
const deleteGrantNumber = makeDeleteCase({
    stateKey: "grant_numbers",
    deletedIdsKey: "deleted_grant_numbers_ids",
    linkField: "grant_number_id",
    clearLink: clearBliGrantNumberLink
});

export function useEditAgreement() {
    return useContext(AgreementEditorContext);
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

export function editAgreementReducer(state, action) {
    switch (action.type) {
        case "SET_STATE": {
            return { ...state, [action.key]: action.value };
        }
        case "UPDATE_AGREEMENT": {
            return {
                ...state,
                agreement: { ...state.agreement, [action.key]: action.value }
            };
        }
        case "ADD_TEAM_MEMBER": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    team_members: [...state.agreement.team_members, action.payload]
                }
            };
        }
        case "DELETE_SERVICE_COMPONENT": {
            return deleteServiceComponent(state, action);
        }
        // Clears every services component at once, e.g. when the agreement type changes and
        // components added under the previous type/shape no longer apply. Mirrors
        // DELETE_SERVICE_COMPONENT's bookkeeping (record ids for backend deletion, reconcile
        // BLI links) rather than RESEED_SERVICES_COMPONENTS, which blanks
        // deleted_services_components_ids and would orphan already-persisted components.
        // (issue #6230)
        case "CLEAR_SERVICES_COMPONENTS": {
            const clearedIds = state.services_components.map((sc) => sc.id).filter(Boolean);
            return {
                ...state,
                services_components: [],
                deleted_services_components_ids: [...state.deleted_services_components_ids, ...clearedIds],
                // Unlike DELETE_SERVICE_COMPONENT, this must also match on
                // services_component_number: a not-yet-persisted BLI (the only case this action
                // is ever dispatched for — the type filter is disabled once an agreement exists)
                // links to its SC by number, not id. handleAddBLI never stamps
                // services_component_id; that only happens post-save, in
                // addServiceComponentIdToBLI.
                budget_line_items: reconcileBudgetLines(
                    state.budget_line_items,
                    (bli) => bli.services_component_id != null || bli.services_component_number,
                    clearBliServiceComponentLink
                )
            };
        }
        case "REMOVE_TEAM_MEMBER": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    team_members: state.agreement.team_members.filter((member) => member.id !== action.payload.id)
                }
            };
        }
        case "RESET_TO_INITIAL_STATE": {
            return initialState;
        }
        case "ADD_SERVICES_COMPONENT": {
            return addServicesComponent(state, action);
        }
        case "UPDATE_SERVICES_COMPONENT": {
            return updateServicesComponent(state, action);
        }
        case "RESEED_SERVICES_COMPONENTS": {
            return {
                ...state,
                services_components: action.payload ?? [],
                deleted_services_components_ids: []
            };
        }
        case "ADD_GRANT_NUMBER": {
            return addGrantNumber(state, action);
        }
        case "UPDATE_GRANT_NUMBER": {
            return updateGrantNumber(state, action);
        }
        case "DELETE_GRANT_NUMBER": {
            return deleteGrantNumber(state, action);
        }
        case "RESEED_GRANT_NUMBERS": {
            return {
                ...state,
                grant_numbers: action.payload ?? [],
                deleted_grant_numbers_ids: []
            };
        }
        // Clears every grant number at once, e.g. when the agreement type changes away from
        // GRANT and numbers added under the previous GRANT selection no longer apply. Mirrors
        // CLEAR_SERVICES_COMPONENTS's bookkeeping (record ids for backend deletion, reconcile
        // BLI links) rather than RESEED_GRANT_NUMBERS, which blanks deleted_grant_numbers_ids
        // and would orphan already-persisted grant numbers. (issue #6230)
        case "CLEAR_GRANT_NUMBERS": {
            const clearedIds = state.grant_numbers.map((gn) => gn.id).filter(Boolean);
            return {
                ...state,
                grant_numbers: [],
                deleted_grant_numbers_ids: [...state.deleted_grant_numbers_ids, ...clearedIds],
                budget_line_items: reconcileBudgetLines(
                    state.budget_line_items,
                    (bli) => bli.grant_number_id != null || bli.grant_number_number,
                    clearBliGrantNumberLink
                )
            };
        }
        case "ADD_BUDGET_LINE_ITEM": {
            return {
                ...state,
                budget_line_items: [...state.budget_line_items, action.payload]
            };
        }
        case "UPDATE_BUDGET_LINE_ITEM": {
            return {
                ...state,
                budget_line_items: state.budget_line_items.map((bli) =>
                    bli.id === action.payload.id ? action.payload : bli
                )
            };
        }
        case "DELETE_BUDGET_LINE_ITEM": {
            return {
                ...state,
                budget_line_items: state.budget_line_items.filter((bli) => bli.id !== action.payload.id),
                deleted_budget_line_items_ids: action.payload.id
                    ? [...state.deleted_budget_line_items_ids, action.payload.id]
                    : [...state.deleted_budget_line_items_ids]
            };
        }
        case "RESEED_BUDGET_LINE_ITEMS": {
            return {
                ...state,
                budget_line_items: action.payload ?? [],
                deleted_budget_line_items_ids: []
            };
        }
        case "SET_RESEARCH_METHODOLOGIES": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    research_methodologies: [...action.payload]
                }
            };
        }
        case "SET_SPECIAL_TOPICS": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    special_topics: [...action.payload]
                }
            };
        }
        case "SET_ALN_NUMBERS": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    aln_numbers: [...action.payload]
                }
            };
        }
        case "ADD_ALN_NUMBER": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    aln_numbers: [...(state.agreement.aln_numbers ?? []), action.payload]
                }
            };
        }
        case "REMOVE_ALN_NUMBER": {
            return {
                ...state,
                agreement: {
                    ...state.agreement,
                    aln_numbers: (state.agreement.aln_numbers ?? []).filter((aln) => aln !== action.payload)
                }
            };
        }
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
