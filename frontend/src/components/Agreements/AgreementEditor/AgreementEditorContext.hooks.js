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
            const remainingScIds = new Set(
                state.services_components.filter((sc) => sc.number !== action.payload.number).map((sc) => sc.id)
            );
            return {
                ...state,
                services_components: state.services_components.filter((sc) => sc.number !== action.payload.number),
                deleted_services_components_ids: action.payload.id
                    ? [...state.deleted_services_components_ids, action.payload.id]
                    : [...state.deleted_services_components_ids],
                // Reconcile BLIs: clear link to deleted SC by ID so sub-components sharing
                // a number don't incorrectly retain stale links.
                budget_line_items: state.budget_line_items.map((bli) => {
                    if (bli.services_component_id != null && !remainingScIds.has(bli.services_component_id)) {
                        return {
                            ...bli,
                            services_component_id: null,
                            services_component_number: 0,
                            serviceComponentGroupingLabel: "0"
                        };
                    }
                    return bli;
                })
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
            return {
                ...state,
                services_components: [...state.services_components, action.payload]
            };
        }
        case "UPDATE_SERVICES_COMPONENT": {
            return {
                ...state,
                services_components: state.services_components.map((sc) =>
                    sc.number === action.payload.number ? action.payload : sc
                )
            };
        }
        case "RESEED_SERVICES_COMPONENTS": {
            return {
                ...state,
                services_components: action.payload ?? [],
                deleted_services_components_ids: []
            };
        }
        case "ADD_GRANT_NUMBER": {
            return {
                ...state,
                grant_numbers: [...state.grant_numbers, action.payload]
            };
        }
        case "UPDATE_GRANT_NUMBER": {
            return {
                ...state,
                grant_numbers: state.grant_numbers.map((gn) =>
                    gn.number === action.payload.number ? action.payload : gn
                )
            };
        }
        case "DELETE_GRANT_NUMBER": {
            const remainingGnIds = new Set(
                state.grant_numbers.filter((gn) => gn.number !== action.payload.number).map((gn) => gn.id)
            );
            return {
                ...state,
                grant_numbers: state.grant_numbers.filter((gn) => gn.number !== action.payload.number),
                deleted_grant_numbers_ids: action.payload.id
                    ? [...state.deleted_grant_numbers_ids, action.payload.id]
                    : [...state.deleted_grant_numbers_ids],
                // Reconcile BLIs: clear link to deleted grant number so the BLI moves
                // to the "not associated" group rather than rendering under a phantom accordion.
                budget_line_items: state.budget_line_items.map((bli) => {
                    if (bli.grant_number_id != null && !remainingGnIds.has(bli.grant_number_id)) {
                        return { ...bli, grant_number_id: null, grant_number_number: 0 };
                    }
                    return bli;
                })
            };
        }
        case "RESEED_GRANT_NUMBERS": {
            return {
                ...state,
                grant_numbers: action.payload ?? [],
                deleted_grant_numbers_ids: []
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
                // Store the full BLI object so the save path can inspect its status for
                // approval routing (isDeletionRoutedToApproval). The deletion API call
                // uses .id from each object; see handleDeletions in CreateBLIsAndSCs.hooks.js.
                deleted_budget_line_items_ids: action.payload.id
                    ? [...state.deleted_budget_line_items_ids, action.payload]
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
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
