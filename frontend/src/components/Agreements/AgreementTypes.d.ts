import { SafeUser } from "../Users/UserTypes";
import { Project } from "../Projects/ProjectTypes";
import { BudgetLine } from "../BudgetLineItems/BudgetLineTypes";

export type Agreement = {
    id: number;
    name: string;
    agreement_type: string;
    description: string;
    product_service_code_id: number;
    agreement_reason: string;
    vendor: string;
    display_name: string;
    project: Project;
    product_service_code: ProductServiceCode;
    procurement_shop: ProcurementShop;
    awarding_entity_id: number;
    notes: string;
    team_members: SafeUser[];
    budget_line_items: BudgetLine[];
    project_id: number;
    project_officer_id: number;
    procurement_tracker_id: number;
    created_on: Date;
    updated_on: Date;
    created_by: any;
    updated_by: any;
    created_by_user: any;
    updated_by_user: any;
};

type ProductServiceCode = {
    id: number;
    name: string;
    naics?: number;
    support_code?: string;
    description?: string;
};

type ProcurementShop = {
    id: number;
    name: string;
    abbr: string;
    fee?: number;
};
