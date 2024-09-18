import { SimpleCAN } from "../CANs/CANTypes";
import { ChangeRequest } from "../ChangeRequests/ChangeRequests";
import { SafeUser } from "../Users/UserTypes";

export type BudgetLine = {
    agreement_id: number;
    amount: number;
    can: SimpleCAN;
    can_id: number;
    change_requests_in_review: ChangeRequest[];
    comments: string;
    created_by: number;
    created_on: Date;
    date_needed: Date;
    fiscal_year: number;
    id: number;
    in_review: boolean;
    line_description: string;
    portfolio_id: number;
    proc_shop_fee_percentage: number;
    services_component_id: number | null;
    status: string;
    team_members: SafeUser[];
    updated_on: Date;
};
