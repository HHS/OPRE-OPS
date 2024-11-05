import { CAN, URL } from "../CANs/CANTypes";
import { SafeUser } from "../Users/UserTypes";

export type Portfolio = {
    id: number;
    name?: string;
    abbreviation: string;
    status?: string;
    cans?: CAN[];
    division_id: number;
    urls?: URL[];
    team_leaders?: SafeUser[];
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: any;
};
