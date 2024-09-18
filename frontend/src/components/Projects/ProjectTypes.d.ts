import { SafeUser } from "../Users/UserTypes";

export type Project = {
    created_by: number | null;
    created_on: Date;
    description: string;
    id: number;
    methodologies: string[];
    origination_date: Date;
    populations: string[];
    short_title: string;
    team_leaders: SafeUser[];
    title: string;
    updated_on: Date;
    url: string;
};
