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
    portfolio?: Portfolio;
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
    allotment?: string;
    allowance?: string;
    appropriation?: string;
    display_name?: string;
    fiscal_year: number;
    fund_code: string;
    funding_partner?: string;
    funding_source?: string;
    id: number;
    method_of_transfer?: keyof typeof CAN_TRANSFER;
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
    id: number;
    notes?: string;
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: any;
};
