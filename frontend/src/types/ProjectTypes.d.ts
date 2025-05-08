import { SafeUser } from "../Users/UserTypes";

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

export type Project = {
    id: number;
    project_type: string;
    title: string;
    short_title: string;
    description: string;
    url?: string;
};
