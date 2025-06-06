import { SafeUser } from "./UserTypes";
import { ResearchProject } from "./ProjectTypes";
import { BudgetLine } from "./BudgetLineTypes";

export type Agreement = {
    team_leaders: string[];
    division_directors: string[];
    _meta: { isEditable: boolean };
    agreement_reason?: string;
    agreement_type: "CONTRACT" | "GRANT" | "DIRECT_ALLOCATION" | "IAA" | "IAA_AA";
    alternate_project_officer_id?: number;
    awarding_entity_id?: number;
    budget_line_items?: BudgetLine[];
    contract_type?: string;
    created_by?: any;
    created_by_user?: any;
    created_on?: Date;
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
    service_requirement_type?: string;
    team_members?: SafeUser[];
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: Date;
    vendor?: string;
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
    fee_percentage?: number;
    id: number;
    name: string;
};

type SimpleAgreement = {
    agreement_type: string;
    name: string;
    awarding_entity_id?: number;
};
