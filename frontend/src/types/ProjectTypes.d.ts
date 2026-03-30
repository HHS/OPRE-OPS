import { SafeUser } from "./UserTypes";

export type ResearchProject = {
    id: number;
    description: string;
    methodologies: string[];
    populations: string[];
    team_leaders: SafeUser[];
    origination_date: Date;
    short_title: string;
    title: string;
    url: string;
    created_on: any;
    updated_on: any;
    created_by: any;
    updated_by: any;
    created_by_user: any;
    updated_by_user: any;
};

export type AgreementNameListItem = {
    id: number;
    name: string;
};

export type Project = {
    id: number;
    project_type: "RESEARCH" | "ADMINISTRATIVE_AND_SUPPORT";
    title: string;
    short_title: string | null;
    description: string | null;
    url?: string;
    origination_date?: string;
    project_start?: string | null;
    project_end?: string | null;
    fiscal_year_totals?: Record<number, string> | null;
    project_total?: string | null;
    agreement_name_list?: AgreementNameListItem[];
    team_leaders?: SafeUser[];
    team_members?: SafeUser[];
    division_directors?: string[];
    research_methodologies?: string[];
    special_topics?: string[];
    created_on?: string;
    updated_on?: string;
    created_by?: any;
    updated_by?: any;
};
