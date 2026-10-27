export type ChangeRequest = {
    agreement_id: number;
    budget_line_item_id?: number;
    change_request_type: string;
    created_by: number;
    created_by_user: {
        display_name?: string;
        full_name: string;
        id: number;
    } | null;
    created_on: string;
    display_name: string;
    has_budget_change?: boolean;
    has_status_change?: boolean;
    has_proc_shop_change?: boolean;
    has_delete_change?: boolean;
    has_services_component_change?: boolean;
    is_services_component_create?: boolean;
    requires_contract_modification?: boolean;
    services_component_id?: number | null;
    id: number;
    managing_division_id: number | null;
    requested_change_data: {
        amount?: number;
        date_needed?: string;
        can_id?: number;
        status?: string;
        awarding_entity_id?: number;
        delete?: boolean;
        services_component_create?: boolean;
    };
    requested_change_diff: {
        amount?: {
            new: number;
            old: number;
        };
        date_needed?: {
            new: string;
            old: string;
        };
        can_id?: {
            new: number;
            old: number;
        };
        status?: {
            new: string;
            old: string;
        };
        awarding_entity_id?: {
            new: number;
            old: number;
        };
        delete?: {
            new: string;
            old: number;
        };
        services_component_create?: {
            new: string;
            old: null;
        };
    };
    requested_change_info?: {
        target_display_name?: string;
        requires_contract_modification?: boolean;
        linked_budget_line_item_ids?: number[];
    } | null;
    requestor_notes: string | null;
    reviewed_on: string | null;
    reviewer_notes: string | null;
    status: "IN_REVIEW" | "APPROVED" | "REJECTED";
    updated_by: number;
    updated_on: string;
};
