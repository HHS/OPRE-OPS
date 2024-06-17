export type ChangeRequest = {
    agreement: number;
    agreement_id: number;
    budget_line_item: number;
    budget_line_item_id: number;
    created_by: number;
    created_by_user: {
        full_name: string;
        id: number;
    };
    created_on: string;
    display_name: string;
    id: number;
    managing_division: number;
    managing_division_id: number;
    requested_change_data: {
        amount: number;
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
    };
    requested_change_info: {
        target_display_name: string;
    };
    reviewed_by_id: number | null;
    reviewed_on: string | null;
    status: string;
    type: string;
    updated_by: number;
    updated_by_user: {
        full_name: string;
        id: number;
    };
};
