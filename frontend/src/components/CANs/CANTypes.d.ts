import { BudgetLine } from "../BudgetLineItems/BudgetLineTypes";
import { Portfolio } from "../Portfolios/PortfolioTypes";
import { Project } from "../Projects/ProjectTypes";

export type CAN = {
    active_period?: number;
    budget_line_items: BudgetLine[];
    created_by: number | null;
    created_by_user: number | null;
    created_on: Date;
    description?: string;
    display_name?: string;
    funding_budgets: CANFundingBudget[];
    funding_details: CANFundingDetails;
    funding_details_id: number;
    funding_received: CANFundingReceived[];
    id: number;
    nick_name?: string;
    number: string;
    obligate_by?: Date;
    portfolio: Portfolio;
    portfolio_id: number;
    projects: Project[];
    updated_by: number | null;
    updated_by_user: number | null;
    updated_on: Date;
};

export type SimpleCAN = {
    active_period: number;
    description: string;
    display_name: string;
    id: number;
    nick_name: string;
    number: string;
    portfolio_id: number;
    projects: Project[];
};

export type URL = {
    created_by: number | null;
    created_by_user: number | null;
    created_on: Date;
    id: number;
    portfolio_id: number;
    updated_by: number | null;
    updated_by_user: number | null;
    updated_on: Date;
    url: string;
};

export type CANFundingBudget = {
    budget: number;
    can: SimpleCAN;
    can_id: number;
    created_by: number | null;
    created_by_user: number | null;
    created_on: Date;
    display_name: string;
    fiscal_year: number;
    id: number;
    notes: string | null;
    updated_by: number | null;
    updated_by_user: number | null;
    updated_on: Date;
};

export type CANFundingDetails = {
    allotment: null;
    allowance: null;
    created_by: null;
    created_by_user: null;
    created_on: Date;
    display_name: string;
    fiscal_year: number;
    fund_code: string;
    funding_partner: null;
    funding_source: string;
    id: number;
    method_of_transfer: "DIRECT" | "COST_SHARE" | "IDDA" | "IAA";
    sub_allowance: null;
    updated_by: null;
    updated_by_user: null;
    updated_on: Date;
};

export type CANFundingReceived = {
    can: SimpleCAN;
    can_id: number;
    created_by: number | null;
    created_by_user: number | null;
    created_on: Date;
    display_name: string;
    fiscal_year: number;
    funding: number;
    id: number;
    notes: string | null;
    updated_by: number | null;
    updated_by_user: number | null;
    updated_on: Date;
};
