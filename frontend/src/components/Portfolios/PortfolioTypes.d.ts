import { CAN, URL } from "../CANs/CANTypes";
import { SafeUser } from "../Users/UserTypes";

export type Division = {
    id: number;
    name?: string;
    abbreviation: string;
    division_director_id: number;
    deputy_division_director_id: number;
    created_by?: number;
    updated_by?: number;
    created_on?: any;
    updated_on?: any;
  };

export type Portfolio = {
    id: number;
    name?: string;
    abbreviation: string;
    status?: string;
    cans?: CAN[];
    division_id: number;
    division: Division;
    urls?: URL[];
    team_leaders?: SafeUser[];
    created_by?: any;
    created_by_user?: any;
    created_on?: any;
    updated_by?: any;
    updated_by_user?: any;
    updated_on?: any;
};
