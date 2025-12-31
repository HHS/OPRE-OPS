import { CAN } from "../CANs/CANTypes";
import { ChangeRequest } from "../ChangeRequests/ChangeRequestsTypes";
import { SafeUser } from "../Users/UserTypes";
import { SimpleAgreement } from "../Agreements/AgreementTypes";

export type BudgetLine = {
    agreement_id: number;
    agreement?: SimpleAgreement; // TODO: remove once data is normalized
    amount?: number;
    can?: CAN;
    can_id?: number;
    change_requests_in_review?: ChangeRequest[];
    comments?: string;
    date_needed?: string;
    fiscal_year?: number;
    id: number;
    in_review: boolean;
    line_description?: string;
    portfolio_id: number;
    proc_shop_fee_percentage: number;
    procurement_shop_fee: {
        created_by: any | null;
        created_on: Date;
        end_date: Date | null;
        fee: number;
        id: number;
        procurement_shop: {
            abbr: string;
            fee_percentage: number;
            id: number;
            name: string;
        };
        procurement_shop_id: number;
        start_date: Date | null;
        updated_by: any | null;
        updated_on: Date;
    } | null;
    requestor_notes?: string;
    services_component_id?: number;
    services_component_number?: number;
    serviceComponentGroupingLabel?: string;
    status: string;
    is_obe: boolean;
    team_members: SafeUser[];
    fees: number;
    total: number;
    created_on: Date;
    updated_on: Date;
    created_by: any | null;
    updated_by: any | null;
    created_by_user: any | null;
    updated_by_user: any | null;
    // NOTE: this property may move to another endpoint
    _meta: {
        isEditable: boolean;
        limit: number;
        number_of_pages: number;
        offset: number;
        queryParameters: string;
        total_amount: number;
        total_count: number;
        total_draft_amount: number;
        total_in_execution_amount: number;
        total_obligated_amount: number;
        total_planned_amount: number;
        total_overcome_by_events_amount: number;
    };
};

export type Filters = {
    fiscal_years: number[];
    statuses: string[];
    portfolios: { id: number; name: string }[];
    budget_line_total_range: { min: number; max: number };
    agreement_types: string[];
    agreement_names: { id: number; name: string }[];
    can_active_periods: number[];
};
