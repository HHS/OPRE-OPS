import { URL } from "../CANs/CANTypes";
import { SafeUser } from "../Users/UserTypes";

export type Portfolio = {
    abbreviation: string;
    created_by: number | null;
    created_by_user: number | null;
    created_on: Date;
    division_id: number;
    id: number;
    name: string;
    status: string;
    team_leaders: SafeUser[];
    updated_by: null;
    updated_by_user: null;
    updated_on: Date;
    urls: URL[];
};
