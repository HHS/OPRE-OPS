import { BudgetLine } from "../BudgetLineItems/BudgetLineTypes";
import { Portfolio } from "../Portfolios/PortfolioTypes";
import { Project } from "../Projects/ProjectTypes";
import { CAN_TRANSFER } from "./CAN.constants";

export type CAN = {
    active_period?: number;
    budget_line_items?: BudgetLine[];
    description?: string;
    display_name?: string;
    funding_budgets?: FundingBudget[];
    funding_details?: FundingDetails;
    funding_details_id?: number;
    funding_received?: FundingReceived[];
    id: number;
    nick_name?: string;
    number: string;
    obligate_by?: number;
    portfolio: Portfolio;
    portfolio_id: number;
    projects?: Project[];
    created_on?: any;
    updated_on?: any;
    created_by?: any;
    updated_by?: any;
    created_by_user?: any;
    updated_by_user?: any;
};

export type BasicCAN = {
    active_period?: number;
    description?: string;
    display_name?: string;
    id: number;
    nick_name?: string;
    number: string;
    portfolio_id: number;
    projects: Project[];
};

export type URL = {
    id: number;
    portfolio_id: number;
    url: string;
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: any;
};

export type FundingBudget = {
    budget?: number;
    can?: BasicCAN;
    can_id: number;
    display_name?: string;
    fiscal_year: number;
    id: number;
    notes?: string;
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: any;
};

export type FundingDetails = {
    active_period?: number;
    allotment?: string;
    allowance?: string;
    appropriation?: string;
    display_name?: string;
    fiscal_year: number;
    fund_code: string;
    funding_partner?: string;
    funding_source?: keyof typeof CAN_FUNDING_SOURCE;
    funding_method?: "Direct" | "Reimbursable";
    funding_received?: "Quarterly" | "FY Start";
    funding_type?: "Discretionary" | "Mandatory";
    id: number;
    method_of_transfer?: keyof typeof CAN_TRANSFER;
    obligate_by?: number;
    sub_allowance?: string;
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_on?: any;
    updated_by_user?: any;
};

export type FundingReceived = {
    can?: number;
    can_id: number;
    display_name?: string;
    fiscal_year: number;
    funding?: number;
    id: number | string;
    tempId?: string;
    notes?: string;
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: any;
};

export type FundingSummary = {
    available_funding: number;
    cans: FundingSummaryCAN[];
    carry_forward_funding: number;
    expected_funding: number;
    in_draft_funding: number;
    in_execution_funding: number;
    new_funding: number;
    obligated_funding: number;
    planned_funding: number;
    received_funding: number;
    total_funding: number;
};

export type FundingSummaryCAN = {
    can: BasicCAN;
    carry_forward_label: string;
    expiration_date: string;
};
