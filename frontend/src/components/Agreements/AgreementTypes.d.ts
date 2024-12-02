import { SafeUser } from "../Users/UserTypes";
import { ResearchProject } from "../Projects/ProjectTypes";
import { BudgetLine } from "../BudgetLineItems/BudgetLineTypes";

export type Agreement = {
    agreement_reason?: string;
    agreement_type: string;
    awarding_entity_id?: number;
    budget_line_items?: BudgetLine[];
    description?: string;
    display_name?: string;
    id: number;
    name: string;
    notes?: string;
    procurement_shop?: ProcurementShop;
    procurement_tracker_id?: number;
    product_service_code?: ProductServiceCode;
    product_service_code_id?: number;
    project?: ResearchProject;
    project_id?: number;
    project_officer_id?: number;
    team_members?: SafeUser[];
    vendor?: string;
    created_on?: Date;
    updated_on?: Date;
    created_by?: any;
    updated_by?: any;
    created_by_user?: any;
    updated_by_user?: any;
};

type ProductServiceCode = {
    description?: string;
    id: number;
    naics?: number;
    name: string;
    support_code?: string;
};

type ProcurementShop = {
    abbr: string;
    fee?: number;
    id: number;
    name: string;
};

type SimpleAgreement = {
    agreement_type: string;
    awarding_entity_id?: number;
    name: string;
};
