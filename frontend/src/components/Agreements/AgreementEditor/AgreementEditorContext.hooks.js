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
        service_requirement_type: SERVICE_REQ_TYPES.NON_SEVERABLE
    },
    selected_project: {},
    selected_product_service_code: {},
    selected_procurement_shop: defaultProcurementShop,
    selected_project_officer: {},
    selected_alternate_project_officer: {},
    wizardSteps: ["Project", "Agreement", "Budget Lines"],
    services_components: []
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
        default: {
            throw Error("Unknown action: " + action.type);
        }
    }
}
