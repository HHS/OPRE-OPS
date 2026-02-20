import { SafeUser } from "./UserTypes";
import { ResearchProject } from "./ProjectTypes";
import { BudgetLine } from "./BudgetLineTypes";
import { ChangeRequest } from "./ChangeRequestsTypes";
import { AgreementType } from "../pages/agreements/agreements.constants";

export type Agreement = {
    team_leaders: string[];
    division_directors: string[];
    _meta: { isEditable: boolean };
    agreement_reason?: string;
    agreement_type: AgreementType;
    alternate_project_officer_id?: number;
    authorized_user_ids?: number[];
    awarding_entity_id?: number;
    budget_line_items?: BudgetLine[];
    contract_type?: string;
    contract_number: string | null;
    created_by?: any;
    created_by_user?: any;
    created_on?: Date;
    description?: string;
    display_name?: string;
    id: number;
    is_awarded: boolean | null;
    name: string;
    nick_name: string | null;
    notes?: string;
    procurement_shop: ProcurementShop | null;
    procurement_tracker_id?: number;
    product_service_code?: ProductServiceCode;
    product_service_code_id?: number;
    project?: ResearchProject;
    project_id?: number;
    project_officer_id?: number;
    service_requirement_type?: "NON_SEVERABLE" | "SEVERABLE";
    team_members?: SafeUser[];
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: Date;
    vendor?: string;
    in_review?: boolean;
    change_requests_in_review?: ChangeRequest[];
    requesting_agency?: string;
    servicing_agency?: string;
    research_methodologies?: ResearchMethodology[];
    special_topics?: SpecialTopic[];
    sc_start_date?: string | null;
    sc_end_date?: string | null;
    agreement_subtotal?: number | null;
    total_agreement_fees?: number | null;
    agreement_total?: number | null;
    lifetime_obligated?: number | null;
};

type ProductServiceCode = {
    description?: string;
    id: number;
    naics?: number;
    name: string;
    support_code?: string;
};

type SimpleAgreement = {
    agreement_type: string;
    name: string;
    awarding_entity_id?: number;
};

type ProcurementShop = {
    id: number;
    name: string;
    abbr: string;
    procurement_shop_fees: ProcurementShopFee[];
    fee_percentage: number;
    current_fee?: ProcurementShopFee | null;
    created_on?: string;
    updated_on?: string;
    created_by?: number;
    updated_by?: number;
};

type ProcurementShopFee = {
    id: number;
    procurement_shop_id: number;
    procurement_shop: {
        id: number;
        name: string;
        abbr: string;
        fee_percentage: number;
    };
    fee: number;
    start_date?: string | null;
    end_date?: string | null;
    created_on?: string;
    updated_on?: string;
    created_by?: number;
    updated_by?: number;
};

export type Agency = {
    abbreviation: string;
    id: number;
    name: string;
    servicing: boolean;
    requesting: boolean;
};

type SpecialTopic = {
    id: number;
    name: string;
};

type ResearchMethodology = {
    id: number;
    name: string;
    detailed_name: string;
};
