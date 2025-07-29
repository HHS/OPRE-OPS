export type ChangeRequest = {
    agreement_id: number;
    budget_line_item_id?: number;
    change_request_type: string;
    created_by: number;
    created_by_user: {
        full_name: string;
        id: number;
    };
    created_on: string;
    display_name: string;
    has_budget_change?: boolean;
    has_status_change?: boolean;
    has_proc_shop_field_names_change?: boolean;
    id: number;
    managing_division_id: number | null;
    requested_change_data: {
        amount?: number;
        date_needed?: string;
        can_id?: number;
        status?: string;
        awarding_entity_id?: number;
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
    };
    requestor_notes: string | null;
    reviewed_on: string | null;
    reviewer_notes: string | null;
    status: "IN_REVIEW" | "APPROVED" | "REJECTED";
    updated_by: number;
    updated_on: string;
};
